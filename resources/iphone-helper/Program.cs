using System.Diagnostics;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using System.Xml.Linq;

var helper = new IphoneReaderHelper();
var result = await helper.GetSnapshotAsync();

var json = JsonSerializer.Serialize(result, new JsonSerializerOptions
{
    DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    WriteIndented = false
});

Console.OutputEncoding = System.Text.Encoding.UTF8;
Console.WriteLine(json);

internal sealed class IphoneReaderHelper
{
    private readonly string[] _commonExecutableRoots =
    {
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "3uTools9", "itunesFlashDll"),
        Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
        Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "dotnet", "packs"),
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonProgramFiles), "Apple", "Mobile Device Support"),
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonProgramFilesX86), "Apple", "Mobile Device Support")
    };

    public async Task<HelperResult> GetSnapshotAsync()
    {
        var environment = new HelperEnvironment
        {
            IdeviceInfoPath = FindExecutable("ideviceinfo.exe"),
            IdeviceIdPath = FindExecutable("idevice_id.exe"),
            IdevicePairPath = FindExecutable("idevicepair.exe"),
            IdeviceDiagnosticsPath = FindExecutable("idevicediagnostics.exe"),
            MobileDeviceDllPath = FindExecutable("MobileDevice.dll"),
            IMobileDeviceNetPath = FindExecutable("iMobileDevice-net.dll"),
            ThreeuToolsIdmInfoPath = ResolveKnownFilePath(
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "3uTools9", "idm_info.dll"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "3uTools9", "idm_info.dll"),
                FindExecutable("idm_info.dll")),
            ThreeuToolsCachePath = ResolveKnownFilePath(
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "3uTools9", "cache", "deviceinfo.txt"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "3uTools9", "cache", "files", "deviceinfo.txt"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "3uTools9", "cache", "deviceinfo.txt"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "3uTools9", "cache", "files", "deviceinfo.txt")),
            AppleMobileDeviceService = await GetAppleServiceStatusAsync()
        };

        try
        {
            if (!string.IsNullOrWhiteSpace(environment.IdeviceInfoPath) &&
                !string.IsNullOrWhiteSpace(environment.IdeviceIdPath))
            {
                var idResult = await RunProcessAsync(environment.IdeviceIdPath, "-l");
                var udid = FirstNonEmptyLine(idResult.StdOut);
                environment.IdeviceIdExitCode = idResult.ExitCode;
                environment.IdeviceIdStdErr = EmptyToNull(idResult.StdErr);
                environment.IdeviceIdStdOut = EmptyToNull(idResult.StdOut);

                if (!string.IsNullOrWhiteSpace(udid))
                {
                    var infoResult = await RunProcessAsync(environment.IdeviceInfoPath, $"-u {udid}");
                    var deviceInfo = ParseKeyValueOutput(infoResult.StdOut);
                    environment.IdeviceInfoExitCode = infoResult.ExitCode;
                    environment.IdeviceInfoStdErr = EmptyToNull(infoResult.StdErr);
                    environment.IdeviceInfoStdOut = EmptyToNull(infoResult.StdOut);

                    if (deviceInfo.Count == 0 &&
                        ShouldAttemptPair(environment.IdeviceInfoStdErr) &&
                        !string.IsNullOrWhiteSpace(environment.IdevicePairPath))
                    {
                        var validateResult = await RunProcessAsync(environment.IdevicePairPath, $"validate -u {udid}");
                        environment.IdevicePairValidateExitCode = validateResult.ExitCode;
                        environment.IdevicePairValidateStdErr = EmptyToNull(validateResult.StdErr);
                        environment.IdevicePairValidateStdOut = EmptyToNull(validateResult.StdOut);

                        var pairResult = await RunProcessAsync(environment.IdevicePairPath, $"pair -u {udid}");
                        environment.IdevicePairExitCode = pairResult.ExitCode;
                        environment.IdevicePairStdErr = EmptyToNull(pairResult.StdErr);
                        environment.IdevicePairStdOut = EmptyToNull(pairResult.StdOut);

                        infoResult = await RunProcessAsync(environment.IdeviceInfoPath, $"-u {udid}");
                        deviceInfo = ParseKeyValueOutput(infoResult.StdOut);
                        environment.IdeviceInfoExitCode = infoResult.ExitCode;
                        environment.IdeviceInfoStdErr = EmptyToNull(infoResult.StdErr);
                        environment.IdeviceInfoStdOut = EmptyToNull(infoResult.StdOut);
                    }
                    
                    if (deviceInfo.Count > 0)
                    {
                        return new HelperResult
                        {
                            Success = true,
                            Source = "csharp-helper-ideviceinfo",
                            Connected = true,
                            DeviceInfo = deviceInfo,
                            Environment = environment
                        };
                    }
                }
            }

            if (!string.IsNullOrWhiteSpace(environment.IMobileDeviceNetPath) &&
                !string.IsNullOrWhiteSpace(environment.IdeviceIdStdOut))
            {
                var wrapperInfo = ManagedLockdownBridge.TryReadValues(
                    environment.IMobileDeviceNetPath,
                    FirstNonEmptyLine(environment.IdeviceIdStdOut));
                environment.ManagedWrapperError = ManagedLockdownBridge.LastError;
                environment.ManagedWrapperDeviceResult = ManagedLockdownBridge.LastDeviceCreateResult;
                environment.ManagedWrapperHandshakeResult = ManagedLockdownBridge.LastHandshakeResult;
                environment.ManagedWrapperClientNewResult = ManagedLockdownBridge.LastClientNewResult;
                environment.ManagedWrapperGetValueFailures = ManagedLockdownBridge.LastGetValueFailures;
                environment.ManagedWrapperDiagnosticsStartResult = ManagedLockdownBridge.LastDiagnosticsStartResult;
                environment.ManagedWrapperDiagnosticsGestaltResult = ManagedLockdownBridge.LastDiagnosticsGestaltResult;
                environment.ManagedWrapperDiagnosticsBatteryResult = ManagedLockdownBridge.LastDiagnosticsBatteryResult;
                environment.ManagedWrapperMobileactivationStartResult = ManagedLockdownBridge.LastMobileactivationStartResult;
                environment.ManagedWrapperMobileactivationInfoResult = ManagedLockdownBridge.LastMobileactivationInfoResult;
                AddLiveAliases(wrapperInfo);

                if (!string.IsNullOrWhiteSpace(environment.ThreeuToolsIdmInfoPath))
                {
                    var threeuInfo = ThreeuToolsBridge.TryReadInfo(
                        environment.ThreeuToolsIdmInfoPath,
                        FirstNonEmptyLine(environment.IdeviceIdStdOut)!);
                    environment.ThreeuToolsReadInfoResult = ThreeuToolsBridge.LastReadInfoResult;
                    environment.ThreeuToolsReadInfoRaw = ThreeuToolsBridge.LastReadInfoRaw;
                    environment.ThreeuToolsError = ThreeuToolsBridge.LastError;

                    foreach (var kv in threeuInfo)
                    {
                        wrapperInfo[kv.Key] = kv.Value;
                        wrapperInfo[$"Live_{kv.Key}"] = kv.Value;
                    }
                }

                var cacheInfo = ThreeuToolsCacheBridge.TryReadInfo(
                    environment.ThreeuToolsCachePath,
                    FirstNonEmptyLine(environment.IdeviceIdStdOut)!);
                environment.ThreeuToolsCachePath = ThreeuToolsCacheBridge.LastDeviceInfoCachePath ?? environment.ThreeuToolsCachePath;
                environment.ThreeuToolsCacheDetailPath = ThreeuToolsCacheBridge.LastDetailPath;
                environment.ThreeuToolsCacheError = ThreeuToolsCacheBridge.LastError;

                foreach (var kv in cacheInfo)
                {
                    wrapperInfo[$"Factory_{kv.Key}"] = kv.Value;
                    if (!wrapperInfo.ContainsKey(kv.Key))
                    {
                        wrapperInfo[kv.Key] = kv.Value;
                    }
                }

                if (!string.IsNullOrWhiteSpace(environment.IdeviceDiagnosticsPath))
                {
                    var diagnosticsInfo = await DiagnosticsCliBridge.TryReadInfoAsync(
                        environment.IdeviceDiagnosticsPath,
                        FirstNonEmptyLine(environment.IdeviceIdStdOut)!);
                    environment.IdeviceDiagnosticsExitCode = DiagnosticsCliBridge.LastExitCode;
                    environment.IdeviceDiagnosticsStdOut = DiagnosticsCliBridge.LastStdOut;
                    environment.IdeviceDiagnosticsStdErr = DiagnosticsCliBridge.LastStdErr;

                    foreach (var kv in diagnosticsInfo)
                    {
                        wrapperInfo[kv.Key] = kv.Value;
                        wrapperInfo[$"Live_{kv.Key}"] = kv.Value;
                    }
                }

                if (wrapperInfo.Count > 0)
                {
                    return new HelperResult
                    {
                        Success = true,
                        Source = environment.ThreeuToolsReadInfoResult == 0
                            ? "csharp-helper-lockdownd-wrapper-3utools"
                            : "csharp-helper-lockdownd-wrapper",
                        Connected = true,
                        DeviceInfo = wrapperInfo,
                        Error = environment.IdeviceInfoStdErr,
                        Environment = environment
                    };
                }
            }

            if (!string.IsNullOrWhiteSpace(environment.MobileDeviceDllPath))
            {
                var nativeInfo = NativeAppleBridge.TryReadDeviceInfo(environment.MobileDeviceDllPath);
                environment.NativeConnectResult = NativeAppleBridge.LastNativeConnectResult;
                environment.NativeIsPairedResult = NativeAppleBridge.LastNativeIsPairedResult;
                environment.NativePairResult = NativeAppleBridge.LastNativePairResult;
                environment.NativeValidateResult = NativeAppleBridge.LastNativeValidateResult;
                environment.NativeStartSessionResult = NativeAppleBridge.LastNativeStartSessionResult;
                if (nativeInfo.Count > 0)
                {
                    return new HelperResult
                    {
                        Success = true,
                        Source = "csharp-helper-mobiledevice",
                        Connected = true,
                        DeviceInfo = nativeInfo,
                        Error = environment.IdeviceInfoStdErr,
                        Environment = environment
                    };
                }
            }

            var pnpDevice = await DetectAppleDeviceAsync();
            return new HelperResult
            {
                Success = true,
                Source = pnpDevice is null ? "csharp-helper-fallback" : "csharp-helper-windows-pnp",
                Connected = pnpDevice is not null,
                PnpDevice = pnpDevice,
                Environment = environment
            };
        }
        catch (Exception ex)
        {
            return new HelperResult
            {
                Success = false,
                Source = "csharp-helper-error",
                Connected = false,
                Error = ex.Message,
                Environment = environment
            };
        }
    }

    private static void AddLiveAliases(Dictionary<string, string> values)
    {
        foreach (var kv in values.ToList())
        {
            values[$"Live_{kv.Key}"] = kv.Value;
        }
    }

    private string? FindExecutable(string executableName)
    {
        var pathVariable = Environment.GetEnvironmentVariable("PATH") ?? string.Empty;
        foreach (var segment in pathVariable.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries))
        {
            try
            {
                var fullPath = Path.Combine(segment.Trim(), executableName);
                if (File.Exists(fullPath))
                {
                    return fullPath;
                }
            }
            catch
            {
                // Ignore malformed PATH segments.
            }
        }

        foreach (var root in _commonExecutableRoots.Where(Directory.Exists))
        {
            try
            {
                var found = Directory
                    .EnumerateFiles(root, executableName, SearchOption.AllDirectories)
                    .FirstOrDefault();

                if (!string.IsNullOrWhiteSpace(found))
                {
                    return found;
                }
            }
            catch
            {
                // Ignore inaccessible directories.
            }
        }

        return null;
    }

    private static bool ShouldAttemptPair(string? stderr)
    {
        if (string.IsNullOrWhiteSpace(stderr))
        {
            return false;
        }

        var normalized = stderr.ToLowerInvariant();
        return normalized.Contains("missing hostid") ||
               normalized.Contains("password protected") ||
               normalized.Contains("could not connect to lockdownd");
    }

    private static async Task<ProcessExecutionResult> RunProcessAsync(string fileName, string arguments)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = fileName,
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = new Process { StartInfo = startInfo };
        process.Start();

        var stdOutTask = process.StandardOutput.ReadToEndAsync();
        var stdErrTask = process.StandardError.ReadToEndAsync();

        await process.WaitForExitAsync();

        return new ProcessExecutionResult
        {
            ExitCode = process.ExitCode,
            StdOut = await stdOutTask,
            StdErr = await stdErrTask
        };
    }

    private static async Task<ServiceSnapshot> GetAppleServiceStatusAsync()
    {
        var serviceNames = new[]
        {
            "Apple Mobile Device Service",
            "Apple Mobile Device",
            "AppleMobileDeviceService"
        };

        ServiceSnapshot? installedButStopped = null;

        foreach (var serviceName in serviceNames)
        {
            var service = await GetServiceStatusAsync(serviceName);
            if (service.Installed)
            {
                var normalized = service with { ServiceName = serviceName };
                if (normalized.Running)
                {
                    return normalized;
                }

                installedButStopped ??= normalized;
            }
        }

        if (installedButStopped is not null)
        {
            return installedButStopped;
        }

        return new ServiceSnapshot(false, false, "No encontrado", null);
    }

    private static async Task<ServiceSnapshot> GetServiceStatusAsync(string serviceName)
    {
        try
        {
            var result = await RunProcessAsync("sc.exe", $"query \"{serviceName}\"");
            var output = result.StdOut + Environment.NewLine + result.StdErr;

            if (string.IsNullOrWhiteSpace(output) || output.Contains("does not exist", StringComparison.OrdinalIgnoreCase))
            {
                return new ServiceSnapshot(false, false, "No encontrado", null);
            }

            var running = output.Contains("RUNNING", StringComparison.OrdinalIgnoreCase);
            return new ServiceSnapshot(true, running, running ? "RUNNING" : "STOPPED", serviceName);
        }
        catch
        {
            return new ServiceSnapshot(false, false, "No encontrado", null);
        }
    }

    private static async Task<PnpSnapshot?> DetectAppleDeviceAsync()
    {
        const string command = """
            $devices = Get-PnpDevice |
              Where-Object {
                $_.Present -eq $true -and (
                  $_.FriendlyName -match 'iPhone|Apple|iPad|Mobile Device' -or
                  $_.InstanceId -match 'USB\\VID_05AC'
                )
              } |
              Select-Object Status, FriendlyName, InstanceId, Class, Present;
            $devices | ConvertTo-Json -Compress
            """;

        var psArgs = $"-NoProfile -ExecutionPolicy Bypass -Command \"{command.Replace("\"", "\\\"").Replace(Environment.NewLine, " ")}\"";
        var result = await RunProcessAsync("powershell.exe", psArgs);
        var raw = FirstNonEmptyLine(result.StdOut);

        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        try
        {
            using var doc = JsonDocument.Parse(raw);
            var node = doc.RootElement.ValueKind == JsonValueKind.Array
                ? doc.RootElement.EnumerateArray().FirstOrDefault()
                : doc.RootElement;

            if (node.ValueKind == JsonValueKind.Undefined || node.ValueKind == JsonValueKind.Null)
            {
                return null;
            }

            return new PnpSnapshot(
                GetJsonString(node, "Status"),
                GetJsonString(node, "FriendlyName"),
                GetJsonString(node, "InstanceId"),
                GetJsonString(node, "Class")
            );
        }
        catch
        {
            return null;
        }
    }

    private static Dictionary<string, string> ParseKeyValueOutput(string raw)
    {
        var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var line in raw.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
        {
            var separatorIndex = line.IndexOf(':');
            if (separatorIndex < 0)
            {
                continue;
            }

            var key = line[..separatorIndex].Trim();
            var value = line[(separatorIndex + 1)..].Trim();

            if (!string.IsNullOrWhiteSpace(key))
            {
                result[key] = value;
            }
        }

        return result;
    }

    private static string? FirstNonEmptyLine(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        return raw
            .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(line => line.Trim())
            .FirstOrDefault(line => !string.IsNullOrWhiteSpace(line));
    }

    private static string? EmptyToNull(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string? ResolveKnownFilePath(params string?[] candidates)
    {
        foreach (var candidate in candidates)
        {
            if (!string.IsNullOrWhiteSpace(candidate) && File.Exists(candidate))
            {
                return candidate;
            }
        }

        return null;
    }

    private static string? GetJsonString(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var property)
            ? property.ToString()
            : null;
    }
}

internal sealed class HelperResult
{
    public bool Success { get; set; }
    public bool Connected { get; set; }
    public string? Source { get; set; }
    public string? Error { get; set; }
    public Dictionary<string, string>? DeviceInfo { get; set; }
    public PnpSnapshot? PnpDevice { get; set; }
    public HelperEnvironment? Environment { get; set; }
}

internal sealed class HelperEnvironment
{
    public string? IdeviceInfoPath { get; set; }
    public string? IdeviceIdPath { get; set; }
    public string? IdevicePairPath { get; set; }
    public string? IdeviceDiagnosticsPath { get; set; }
    public string? MobileDeviceDllPath { get; set; }
    public string? IMobileDeviceNetPath { get; set; }
    public string? ThreeuToolsIdmInfoPath { get; set; }
    public string? ThreeuToolsCachePath { get; set; }
    public int? IdeviceInfoExitCode { get; set; }
    public int? IdeviceIdExitCode { get; set; }
    public int? IdevicePairExitCode { get; set; }
    public int? IdevicePairValidateExitCode { get; set; }
    public int? IdeviceDiagnosticsExitCode { get; set; }
    public string? IdeviceInfoStdErr { get; set; }
    public string? IdeviceIdStdErr { get; set; }
    public string? IdevicePairStdErr { get; set; }
    public string? IdevicePairValidateStdErr { get; set; }
    public string? IdeviceDiagnosticsStdErr { get; set; }
    public string? IdeviceInfoStdOut { get; set; }
    public string? IdeviceIdStdOut { get; set; }
    public string? IdevicePairStdOut { get; set; }
    public string? IdevicePairValidateStdOut { get; set; }
    public string? IdeviceDiagnosticsStdOut { get; set; }
    public int? NativeConnectResult { get; set; }
    public int? NativeIsPairedResult { get; set; }
    public int? NativePairResult { get; set; }
    public int? NativeValidateResult { get; set; }
    public int? NativeStartSessionResult { get; set; }
    public int? ManagedWrapperDeviceResult { get; set; }
    public int? ManagedWrapperHandshakeResult { get; set; }
    public int? ManagedWrapperClientNewResult { get; set; }
    public string? ManagedWrapperGetValueFailures { get; set; }
    public string? ManagedWrapperError { get; set; }
    public int? ManagedWrapperDiagnosticsStartResult { get; set; }
    public int? ManagedWrapperDiagnosticsGestaltResult { get; set; }
    public int? ManagedWrapperDiagnosticsBatteryResult { get; set; }
    public int? ManagedWrapperMobileactivationStartResult { get; set; }
    public int? ManagedWrapperMobileactivationInfoResult { get; set; }
    public int? ThreeuToolsReadInfoResult { get; set; }
    public string? ThreeuToolsReadInfoRaw { get; set; }
    public string? ThreeuToolsError { get; set; }
    public string? ThreeuToolsCacheDetailPath { get; set; }
    public string? ThreeuToolsCacheError { get; set; }
    public ServiceSnapshot? AppleMobileDeviceService { get; set; }
}

internal static class ManagedLockdownBridge
{
    public static int? LastDeviceCreateResult { get; private set; }
    public static int? LastHandshakeResult { get; private set; }
    public static int? LastClientNewResult { get; private set; }
    public static string? LastGetValueFailures { get; private set; }
    public static string? LastError { get; private set; }
    public static int? LastDiagnosticsStartResult { get; private set; }
    public static int? LastDiagnosticsGestaltResult { get; private set; }
    public static int? LastDiagnosticsBatteryResult { get; private set; }
    public static int? LastMobileactivationStartResult { get; private set; }
    public static int? LastMobileactivationInfoResult { get; private set; }

    public static Dictionary<string, string> TryReadValues(string wrapperDllPath, string udid)
    {
        try
        {
            LastDeviceCreateResult = null;
            LastHandshakeResult = null;
            LastClientNewResult = null;
            LastGetValueFailures = null;
            LastError = null;
            LastDiagnosticsStartResult = null;
            LastDiagnosticsGestaltResult = null;
            LastDiagnosticsBatteryResult = null;
            LastMobileactivationStartResult = null;
            LastMobileactivationInfoResult = null;

            var wrapperDir = Path.GetDirectoryName(wrapperDllPath);
            if (string.IsNullOrWhiteSpace(wrapperDir))
            {
                return new Dictionary<string, string>();
            }

            SetDllDirectory(wrapperDir);
            var asm = System.Runtime.Loader.AssemblyLoadContext.Default.LoadFromAssemblyPath(wrapperDllPath);

            var libType = asm.GetType("iMobileDevice.LibiMobileDevice");
            var deviceHandleType = asm.GetType("iMobileDevice.iDevice.iDeviceHandle");
            var lockdownHandleType = asm.GetType("iMobileDevice.Lockdown.LockdownClientHandle");
            var plistHandleType = asm.GetType("iMobileDevice.Plist.PlistHandle");

            if (libType == null || deviceHandleType == null || lockdownHandleType == null || plistHandleType == null)
            {
                return new Dictionary<string, string>();
            }

            var lib = libType.GetProperty("Instance", BindingFlags.Public | BindingFlags.Static)?.GetValue(null);
            if (lib == null)
            {
                return new Dictionary<string, string>();
            }

            var iDeviceApi = libType.GetProperty("iDevice")?.GetValue(lib);
            var lockdownApi = libType.GetProperty("Lockdown")?.GetValue(lib);
            var plistApi = libType.GetProperty("Plist")?.GetValue(lib);
            var diagnosticsRelayApi = libType.GetProperty("DiagnosticsRelay")?.GetValue(lib);
            var mobileactivationApi = libType.GetProperty("Mobileactivation")?.GetValue(lib);

            if (iDeviceApi == null || lockdownApi == null || plistApi == null)
            {
                return new Dictionary<string, string>();
            }

            var ideviceNewWithOptions = iDeviceApi.GetType().GetMethod("idevice_new_with_options");
            var lockdownClientWithHandshake = lockdownApi.GetType().GetMethod("lockdownd_client_new_with_handshake");
            var lockdownClientNew = lockdownApi.GetType().GetMethod("lockdownd_client_new");
            var lockdownGetValue = lockdownApi.GetType().GetMethod("lockdownd_get_value");
            var plistGetStringVal = plistApi.GetType().GetMethod("plist_get_string_val");
            var plistToXml = plistApi.GetType().GetMethod("plist_to_xml");

            if (ideviceNewWithOptions == null || (lockdownClientWithHandshake == null && lockdownClientNew == null) || lockdownGetValue == null || plistGetStringVal == null || plistToXml == null)
            {
                return new Dictionary<string, string>();
            }

            var deviceHandle = Activator.CreateInstance(deviceHandleType, nonPublic: true);
            var ideviceArgs = new object[] { deviceHandle, udid, 2 };
            var ideviceResult = Convert.ToInt32(ideviceNewWithOptions.Invoke(iDeviceApi, ideviceArgs));
            LastDeviceCreateResult = ideviceResult;
            if (ideviceResult != 0)
            {
                return new Dictionary<string, string>();
            }

            deviceHandle = ideviceArgs[0];
            var (lockdownHandle, lockdownResult) = CreateLockdownClient(lockdownApi, lockdownHandleType, deviceHandle, lockdownClientWithHandshake, lockdownClientNew);
            if (lockdownHandle == null || lockdownResult != 0)
            {
                return new Dictionary<string, string>();
            }
            var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            var failures = new List<string>();

            foreach (var request in GetLockdownRequests())
            {
                if (values.ContainsKey(request.Key))
                {
                    continue;
                }

                if (TryReadLockdownValue(
                    lockdownApi,
                    lockdownGetValue,
                    plistApi,
                    plistGetStringVal,
                    plistToXml,
                    plistHandleType,
                    lockdownHandle,
                    request.Domain,
                    request.Key,
                    out var value))
                {
                    values[request.Key] = value;
                    continue;
                }

                failures.Add($"{request.Key}@{request.Domain ?? "root"}");
            }

            LastGetValueFailures = failures.Count > 0 ? string.Join(", ", failures) : null;

            if (diagnosticsRelayApi != null)
            {
                MergeValues(values, ReadDiagnosticsRelayValues(
                    diagnosticsRelayApi,
                    plistApi,
                    asm,
                    deviceHandle));
            }

            if (mobileactivationApi != null)
            {
                MergeValues(values, ReadMobileactivationValues(
                    mobileactivationApi,
                    plistApi,
                    asm,
                    deviceHandle));
            }

            TryDispose(deviceHandleType, deviceHandle);
            TryDispose(lockdownHandleType, lockdownHandle);

            return values;
        }
        catch (Exception ex)
        {
            LastError = ex.Message;
            return new Dictionary<string, string>();
        }
    }

    private static IEnumerable<(string? Domain, string Key)> GetLockdownRequests()
    {
        foreach (var key in new[]
        {
            "DeviceName",
            "ProductType",
            "ProductVersion",
            "SerialNumber",
            "UniqueDeviceID",
            "WiFiAddress",
            "HardwareModel",
            "ModelNumber"
        })
        {
            yield return (null, key);
        }

        foreach (var key in new[]
        {
            "TotalDiskCapacity",
            "TotalDataCapacity",
            "TotalDataAvailable",
            "AmountDataAvailable",
            "AmountDataReserved",
            "AmountRestoreAvailable",
            "TotalSystemCapacity",
            "TotalSystemAvailable"
        })
        {
            yield return ("com.apple.disk_usage", key);
            yield return (null, key);
        }

        foreach (var key in new[]
        {
            "BatteryCurrentCapacity",
            "BatteryCurrentCapacityPercent",
            "BatteryIsCharging",
            "CurrentCapacity",
            "AppleRawCurrentCapacity",
            "NominalChargeCapacity",
            "MaximumCapacityPercent",
            "CycleCount",
            "DesignCapacity",
            "FullChargeCapacity"
        })
        {
            yield return ("com.apple.mobile.battery", key);
            yield return ("com.apple.ioregistry", key);
            yield return (null, key);
        }
    }

    private static bool TryReadLockdownValue(
        object lockdownApi,
        MethodInfo lockdownGetValue,
        object plistApi,
        MethodInfo plistGetStringVal,
        MethodInfo plistToXml,
        Type plistHandleType,
        object lockdownHandle,
        string? domain,
        string key,
        out string value)
    {
        value = string.Empty;

        try
        {
            var plistHandle = Activator.CreateInstance(plistHandleType, nonPublic: true);
            var getValueArgs = new object?[] { lockdownHandle, domain, key, plistHandle };
            var getValueResult = Convert.ToInt32(lockdownGetValue.Invoke(lockdownApi, getValueArgs));
            if (getValueResult != 0)
            {
                return false;
            }

            plistHandle = getValueArgs[3];
            var stringArgs = new object?[] { plistHandle, null };
            plistGetStringVal.Invoke(plistApi, stringArgs);
            var stringValue = stringArgs[1] as string;
            if (!string.IsNullOrWhiteSpace(stringValue))
            {
                value = stringValue.Trim();
                return true;
            }

            var xmlArgs = new object?[] { plistHandle, null, (uint)0 };
            plistToXml.Invoke(plistApi, xmlArgs);
            var xml = xmlArgs[1] as string;
            var parsed = ParseValueFromPlistXml(xml);
            if (!string.IsNullOrWhiteSpace(parsed))
            {
                value = parsed;
                return true;
            }
        }
        catch
        {
            return false;
        }

        return false;
    }

    private static (object? Handle, int Result) CreateLockdownClient(
        object lockdownApi,
        Type lockdownHandleType,
        object deviceHandle,
        MethodInfo? lockdownClientWithHandshake,
        MethodInfo? lockdownClientNew)
    {
        if (lockdownClientWithHandshake != null)
        {
            var handle = Activator.CreateInstance(lockdownHandleType, nonPublic: true);
            var args = new object?[] { deviceHandle, handle, "tm-pos" };
            var result = Convert.ToInt32(lockdownClientWithHandshake.Invoke(lockdownApi, args));
            LastHandshakeResult = result;
            if (result == 0)
            {
                return (args[1], 0);
            }
        }

        if (lockdownClientNew != null)
        {
            var handle = Activator.CreateInstance(lockdownHandleType, nonPublic: true);
            var args = new object?[] { deviceHandle, handle, "tm-pos" };
            var result = Convert.ToInt32(lockdownClientNew.Invoke(lockdownApi, args));
            LastClientNewResult = result;
            return (result == 0 ? args[1] : null, result);
        }

        return (null, -1);
    }

    private static Dictionary<string, string> ReadDiagnosticsRelayValues(
        object diagnosticsRelayApi,
        object plistApi,
        Assembly asm,
        object deviceHandle)
    {
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        try
        {
            var diagnosticsClientHandleType = asm.GetType("iMobileDevice.DiagnosticsRelay.DiagnosticsRelayClientHandle");
            var plistHandleType = asm.GetType("iMobileDevice.Plist.PlistHandle");

            if (diagnosticsClientHandleType == null || plistHandleType == null)
            {
                return values;
            }

            var startService = diagnosticsRelayApi.GetType().GetMethod("diagnostics_relay_client_start_service");
            var queryMobileGestalt = diagnosticsRelayApi.GetType().GetMethod("diagnostics_relay_query_mobilegestalt");
            var queryIoRegistryEntry = diagnosticsRelayApi.GetType().GetMethod("diagnostics_relay_query_ioregistry_entry");
            var plistNewArray = plistApi.GetType().GetMethod("plist_new_array");
            var plistNewString = plistApi.GetType().GetMethod("plist_new_string");
            var plistArrayAppendItem = plistApi.GetType().GetMethod("plist_array_append_item");
            var plistToXml = plistApi.GetType().GetMethod("plist_to_xml");

            if (startService == null || plistToXml == null)
            {
                return values;
            }

            var diagnosticsClientHandle = Activator.CreateInstance(diagnosticsClientHandleType, nonPublic: true);
            var startArgs = new object?[] { deviceHandle, diagnosticsClientHandle, "tm-pos" };
            var startResult = Convert.ToInt32(startService.Invoke(diagnosticsRelayApi, startArgs));
            LastDiagnosticsStartResult = startResult;
            if (startResult != 0)
            {
                return values;
            }

            diagnosticsClientHandle = startArgs[1];

            if (queryMobileGestalt != null && plistNewArray != null && plistNewString != null && plistArrayAppendItem != null)
            {
                var requestKeys = plistNewArray.Invoke(plistApi, null);
                foreach (var key in new[]
                {
                    "SerialNumber",
                    "InternationalMobileEquipmentIdentity",
                    "MobileEquipmentIdentifier",
                    "BatteryCurrentCapacity",
                    "BatteryIsCharging",
                    "ModelNumber"
                })
                {
                    var keyNode = plistNewString.Invoke(plistApi, new object?[] { key });
                    plistArrayAppendItem.Invoke(plistApi, new[] { requestKeys, keyNode });
                }

                var responseHandle = Activator.CreateInstance(plistHandleType, nonPublic: true);
                var gestaltArgs = new object?[] { diagnosticsClientHandle, requestKeys, responseHandle };
                var gestaltResult = Convert.ToInt32(queryMobileGestalt.Invoke(diagnosticsRelayApi, gestaltArgs));
                LastDiagnosticsGestaltResult = gestaltResult;
                if (gestaltResult == 0)
                {
                    responseHandle = gestaltArgs[2];
                    var gestaltXml = ConvertPlistToXml(plistApi, plistToXml, responseHandle);
                    MergeValues(values, ExtractInterestingValuesFromXml(gestaltXml));
                }
            }

            if (queryIoRegistryEntry != null)
            {
                var batteryResponseHandle = Activator.CreateInstance(plistHandleType, nonPublic: true);
                var batteryArgs = new object?[] { diagnosticsClientHandle, "AppleSmartBattery", "IOService", batteryResponseHandle };
                var batteryResult = Convert.ToInt32(queryIoRegistryEntry.Invoke(diagnosticsRelayApi, batteryArgs));
                LastDiagnosticsBatteryResult = batteryResult;
                if (batteryResult == 0)
                {
                    batteryResponseHandle = batteryArgs[3];
                    var batteryXml = ConvertPlistToXml(plistApi, plistToXml, batteryResponseHandle);
                    MergeValues(values, ExtractInterestingValuesFromXml(batteryXml));
                }
            }

            TryDispose(diagnosticsClientHandleType, diagnosticsClientHandle);
        }
        catch
        {
            // Best-effort enrichment only.
        }

        return values;
    }

    private static Dictionary<string, string> ReadMobileactivationValues(
        object mobileactivationApi,
        object plistApi,
        Assembly asm,
        object deviceHandle)
    {
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        try
        {
            var mobileactivationClientHandleType = asm.GetType("iMobileDevice.Mobileactivation.MobileactivationClientHandle");
            var plistHandleType = asm.GetType("iMobileDevice.Plist.PlistHandle");

            if (mobileactivationClientHandleType == null || plistHandleType == null)
            {
                return values;
            }

            var startService = mobileactivationApi.GetType().GetMethod("mobileactivation_client_start_service");
            var createActivationInfo = mobileactivationApi.GetType().GetMethod("mobileactivation_create_activation_info");
            var plistToXml = plistApi.GetType().GetMethod("plist_to_xml");

            if (startService == null || createActivationInfo == null || plistToXml == null)
            {
                return values;
            }

            var clientHandle = Activator.CreateInstance(mobileactivationClientHandleType, nonPublic: true);
            var startArgs = new object?[] { deviceHandle, clientHandle, "tm-pos" };
            var startResult = Convert.ToInt32(startService.Invoke(mobileactivationApi, startArgs));
            LastMobileactivationStartResult = startResult;
            if (startResult != 0)
            {
                return values;
            }

            clientHandle = startArgs[1];
            var infoHandle = Activator.CreateInstance(plistHandleType, nonPublic: true);
            var infoArgs = new object?[] { clientHandle, infoHandle };
            var infoResult = Convert.ToInt32(createActivationInfo.Invoke(mobileactivationApi, infoArgs));
            LastMobileactivationInfoResult = infoResult;
            if (infoResult == 0)
            {
                infoHandle = infoArgs[1];
                var xml = ConvertPlistToXml(plistApi, plistToXml, infoHandle);
                MergeValues(values, ExtractInterestingValuesFromXml(xml));
            }

            TryDispose(mobileactivationClientHandleType, clientHandle);
        }
        catch
        {
            // Best-effort enrichment only.
        }

        return values;
    }

    private static string ConvertPlistToXml(object plistApi, MethodInfo plistToXml, object? plistHandle)
    {
        if (plistHandle == null)
        {
            return string.Empty;
        }

        try
        {
            var xmlArgs = new object?[] { plistHandle, null, (uint)0 };
            plistToXml.Invoke(plistApi, xmlArgs);
            return xmlArgs[1] as string ?? string.Empty;
        }
        catch
        {
            return string.Empty;
        }
    }

    private static Dictionary<string, string> ExtractInterestingValuesFromXml(string xml)
    {
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(xml))
        {
            return values;
        }

        try
        {
            var doc = XDocument.Parse(xml);
            foreach (var dict in doc.Descendants().Where(node => node.Name.LocalName == "dict"))
            {
                var nodes = dict.Elements().ToList();
                for (var i = 0; i < nodes.Count - 1; i++)
                {
                    if (nodes[i].Name.LocalName != "key")
                    {
                        continue;
                    }

                    var key = nodes[i].Value?.Trim();
                    var valueNode = nodes[i + 1];
                    if (string.IsNullOrWhiteSpace(key))
                    {
                        continue;
                    }

                    if (!IsInterestingKey(key))
                    {
                        continue;
                    }

                    var value = ParsePlistValueNode(valueNode);
                    if (!string.IsNullOrWhiteSpace(value))
                    {
                        values[key] = value;
                    }
                }
            }
        }
        catch
        {
            return values;
        }

        return values;
    }

    private static bool IsInterestingKey(string key)
    {
        return key is
            "SerialNumber" or
            "IMEI" or
            "InternationalMobileEquipmentIdentity" or
            "MobileEquipmentIdentifier" or
            "ModelNumber" or
            "BatteryCurrentCapacity" or
            "BatteryIsCharging" or
            "CurrentCapacity" or
            "AppleRawCurrentCapacity" or
            "CycleCount" or
            "DesignCapacity";
    }

    private static string ParsePlistValueNode(XElement? valueNode)
    {
        if (valueNode == null)
        {
            return string.Empty;
        }

        var nodeName = valueNode.Name.LocalName;
        if (nodeName is "string" or "integer" or "real" or "data")
        {
            return valueNode.Value?.Trim() ?? string.Empty;
        }

        if (nodeName == "true")
        {
            return "true";
        }

        if (nodeName == "false")
        {
            return "false";
        }

        return string.Empty;
    }

    private static void MergeValues(Dictionary<string, string> target, Dictionary<string, string> source)
    {
        foreach (var kv in source)
        {
            if (!string.IsNullOrWhiteSpace(kv.Value))
            {
                target[kv.Key] = kv.Value;
            }
        }
    }

    private static string ParseValueFromPlistXml(string xml)
    {
        if (string.IsNullOrWhiteSpace(xml))
        {
            return string.Empty;
        }

        try
        {
            var doc = XDocument.Parse(xml);
            var firstValue = doc.Descendants()
                .FirstOrDefault(node =>
                    node.Name.LocalName == "string" ||
                    node.Name.LocalName == "integer" ||
                    node.Name.LocalName == "real" ||
                    node.Name.LocalName == "data");

            return firstValue != null ? firstValue.Value : string.Empty;
        }
        catch
        {
            return string.Empty;
        }
    }

    private static void TryDispose(Type type, object instance)
    {
        if (type == null || instance == null)
        {
            return;
        }

        var dispose = type.GetMethod("Dispose", BindingFlags.Public | BindingFlags.Instance);
        dispose?.Invoke(instance, null);
    }

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool SetDllDirectory(string lpPathName);
}

internal sealed record ServiceSnapshot(bool Installed, bool Running, string Status, string? ServiceName);

internal sealed record PnpSnapshot(string? Status, string? FriendlyName, string? InstanceId, string? Class);

internal sealed class ProcessExecutionResult
{
    public int ExitCode { get; set; }
    public string StdOut { get; set; } = string.Empty;
    public string StdErr { get; set; } = string.Empty;
}

internal static class ThreeuToolsBridge
{
    public static int? LastReadInfoResult { get; private set; }
    public static string? LastReadInfoRaw { get; private set; }
    public static string? LastError { get; private set; }

    public static Dictionary<string, string> TryReadInfo(string idmInfoDllPath, string udid)
    {
        LastReadInfoResult = null;
        LastReadInfoRaw = null;
        LastError = null;

        try
        {
            var dllDirectory = Path.GetDirectoryName(idmInfoDllPath);
            if (string.IsNullOrWhiteSpace(dllDirectory))
            {
                return new Dictionary<string, string>();
            }

            SetDllDirectory(dllDirectory);
            var library = NativeLibrary.Load(idmInfoDllPath);
            try
            {
                var export = NativeLibrary.GetExport(library, "ios_read_info");
                var iosReadInfo = Marshal.GetDelegateForFunctionPointer<IosReadInfoDelegate>(export);
                var buffer = new byte[1024 * 256];
                var result = iosReadInfo(udid, buffer, buffer.Length);
                LastReadInfoResult = result;

                var raw = ReadBufferText(buffer);
                LastReadInfoRaw = raw;

                if (result != 0 || string.IsNullOrWhiteSpace(raw))
                {
                    return new Dictionary<string, string>();
                }

                return ParseThreeuInfo(raw);
            }
            finally
            {
                NativeLibrary.Free(library);
            }
        }
        catch (Exception ex)
        {
            LastError = ex.Message;
            return new Dictionary<string, string>();
        }
    }

    private static Dictionary<string, string> ParseThreeuInfo(string raw)
    {
        var parsed = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        try
        {
            using var doc = JsonDocument.Parse(raw);
            FlattenJson(doc.RootElement, parsed);
        }
        catch
        {
            foreach (var kv in raw.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
            {
                var idx = kv.IndexOf(':');
                if (idx <= 0)
                {
                    continue;
                }

                var key = kv[..idx].Trim();
                var value = kv[(idx + 1)..].Trim();
                if (!string.IsNullOrWhiteSpace(key) && !string.IsNullOrWhiteSpace(value))
                {
                    parsed[key] = value;
                }
            }
        }

        return parsed;
    }

    private static void FlattenJson(JsonElement element, Dictionary<string, string> target, string prefix = "")
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    FlattenJson(
                        property.Value,
                        target,
                        string.IsNullOrWhiteSpace(prefix) ? property.Name : $"{prefix}.{property.Name}");
                }
                break;
            case JsonValueKind.Array:
                var index = 0;
                foreach (var item in element.EnumerateArray())
                {
                    FlattenJson(item, target, $"{prefix}[{index}]");
                    index++;
                }
                break;
            case JsonValueKind.String:
            case JsonValueKind.Number:
            case JsonValueKind.True:
            case JsonValueKind.False:
                if (!string.IsNullOrWhiteSpace(prefix))
                {
                    target[prefix] = element.ToString();
                }
                break;
        }
    }

    private static string ReadBufferText(byte[] buffer)
    {
        var firstZero = Array.IndexOf(buffer, (byte)0);
        var length = firstZero >= 0 ? firstZero : buffer.Length;
        if (length <= 0)
        {
            return string.Empty;
        }

        var ascii = Encoding.ASCII.GetString(buffer, 0, length).Trim();
        return ascii;
    }

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool SetDllDirectory(string lpPathName);

    [UnmanagedFunctionPointer(CallingConvention.Winapi, CharSet = CharSet.Ansi)]
    private delegate int IosReadInfoDelegate(string udid, byte[] buffer, int len);
}

internal static class ThreeuToolsCacheBridge
{
    public static string? LastDeviceInfoCachePath { get; private set; }
    public static string? LastDetailPath { get; private set; }
    public static string? LastError { get; private set; }

    public static Dictionary<string, string> TryReadInfo(string? deviceInfoCachePath, string udid)
    {
        LastDeviceInfoCachePath = null;
        LastDetailPath = null;
        LastError = null;

        try
        {
            var normalizedUdid = NormalizeUdid(udid);
            var resolvedCachePath = ResolveDeviceInfoCachePath(deviceInfoCachePath);
            LastDeviceInfoCachePath = resolvedCachePath;

            if (string.IsNullOrWhiteSpace(normalizedUdid) || string.IsNullOrWhiteSpace(resolvedCachePath) || !File.Exists(resolvedCachePath))
            {
                return new Dictionary<string, string>();
            }

            var cacheDir = Path.GetDirectoryName(resolvedCachePath) ?? string.Empty;
            var rootCacheDir = Path.GetFileName(cacheDir).Equals("files", StringComparison.OrdinalIgnoreCase)
                ? Directory.GetParent(cacheDir)?.FullName ?? cacheDir
                : cacheDir;

            string? serial = null;
            string? imei = null;

            foreach (var line in File.ReadLines(resolvedCachePath))
            {
                var parts = line.Split('\t', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                if (parts.Length < 4)
                {
                    continue;
                }

                if (!string.Equals(NormalizeUdid(parts[1]), normalizedUdid, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                serial = parts[2];
                imei = parts[3];
            }

            var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            if (!string.IsNullOrWhiteSpace(serial))
            {
                values["SerialNumber"] = serial;
            }

            if (!string.IsNullOrWhiteSpace(imei))
            {
                values["InternationalMobileEquipmentIdentity"] = imei;
            }

            if (!string.IsNullOrWhiteSpace(serial))
            {
                var detailPath = Path.Combine(rootCacheDir, $"{serial}_info.txt");
                LastDetailPath = detailPath;
                if (File.Exists(detailPath))
                {
                    foreach (var detailLine in File.ReadLines(detailPath))
                    {
                        var kv = ParseAlignedKeyValueLine(detailLine);
                        if (kv == null)
                        {
                            continue;
                        }

                        values[kv.Value.Key] = kv.Value.Value;
                    }
                }
            }

            return values;
        }
        catch (Exception ex)
        {
            LastError = ex.Message;
            return new Dictionary<string, string>();
        }
    }

    private static KeyValuePair<string, string>? ParseAlignedKeyValueLine(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
        {
            return null;
        }

        var match = Regex.Match(line, @"^(?<key>.+?)\s{2,}(?<value>.+)$");
        if (!match.Success)
        {
            return null;
        }

        var key = match.Groups["key"].Value.Trim();
        var value = match.Groups["value"].Value.Trim();
        if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return new KeyValuePair<string, string>(key, value);
    }

    private static string NormalizeUdid(string? udid)
    {
        return string.IsNullOrWhiteSpace(udid)
            ? string.Empty
            : udid.Replace("-", string.Empty, StringComparison.OrdinalIgnoreCase).Trim();
    }

    private static string? ResolveDeviceInfoCachePath(string? preferredPath)
    {
        var candidates = new[]
        {
            preferredPath,
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "3uTools9", "cache", "files", "deviceinfo.txt"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "3uTools9", "cache", "deviceinfo.txt"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "3uTools9", "cache", "files", "deviceinfo.txt"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "3uTools9", "cache", "deviceinfo.txt")
        };

        foreach (var candidate in candidates)
        {
            if (!string.IsNullOrWhiteSpace(candidate) && File.Exists(candidate))
            {
                return candidate;
            }
        }

        return null;
    }
}

internal static class DiagnosticsCliBridge
{
    public static int? LastExitCode { get; private set; }
    public static string? LastStdOut { get; private set; }
    public static string? LastStdErr { get; private set; }

    public static async Task<Dictionary<string, string>> TryReadInfoAsync(string diagnosticsPath, string udid)
    {
        LastExitCode = null;
        LastStdOut = null;
        LastStdErr = null;

        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        var stdoutParts = new List<string>();
        var stderrParts = new List<string>();

        foreach (var arguments in new[]
        {
            $"-u {udid} diagnostics GasGauge",
            $"-u {udid} diagnostics NAND",
            $"-u {udid} ioregentry AppleSmartBattery",
            $"-u {udid} ioregentry ASPStorage",
            $"-u {udid} mobilegestalt BatteryCurrentCapacity BatteryCurrentCapacityPercent BatteryIsCharging CurrentCapacity AppleRawCurrentCapacity CycleCount DesignCapacity FullChargeCapacity TotalDiskCapacity TotalDataCapacity TotalDataAvailable"
        })
        {
            try
            {
                var startInfo = new ProcessStartInfo
                {
                    FileName = diagnosticsPath,
                    Arguments = arguments,
                    WorkingDirectory = Path.GetDirectoryName(diagnosticsPath) ?? string.Empty,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using var process = Process.Start(startInfo);
                if (process == null)
                {
                    continue;
                }

                var stdOutTask = process.StandardOutput.ReadToEndAsync();
                var stdErrTask = process.StandardError.ReadToEndAsync();
                await process.WaitForExitAsync();
                var stdOut = (await stdOutTask).Trim();
                var stdErr = (await stdErrTask).Trim();

                LastExitCode = process.ExitCode;
                if (!string.IsNullOrWhiteSpace(stdOut))
                {
                    stdoutParts.Add($"[{arguments}]\n{stdOut}");
                    foreach (var kv in ParseDiagnosticsOutput(stdOut))
                    {
                        if (!string.IsNullOrWhiteSpace(kv.Value))
                        {
                            values[kv.Key] = kv.Value;
                        }
                    }
                }

                if (!string.IsNullOrWhiteSpace(stdErr))
                {
                    stderrParts.Add($"[{arguments}]\n{stdErr}");
                }
            }
            catch (Exception ex)
            {
                stderrParts.Add($"[{arguments}]\n{ex.Message}");
            }
        }

        LastStdOut = stdoutParts.Count > 0 ? string.Join("\n\n", stdoutParts) : null;
        LastStdErr = stderrParts.Count > 0 ? string.Join("\n\n", stderrParts) : null;
        return values;
    }

    private static Dictionary<string, string> ParseDiagnosticsOutput(string raw)
    {
        var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var line in raw.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries))
        {
            var aligned = Regex.Match(line, @"^(?<key>.+?)\s{2,}(?<value>.+)$");
            if (aligned.Success)
            {
                var key = aligned.Groups["key"].Value.Trim();
                var value = aligned.Groups["value"].Value.Trim();
                if (!string.IsNullOrWhiteSpace(key) && !string.IsNullOrWhiteSpace(value))
                {
                    values[key] = value;
                }

                continue;
            }

            var colonIndex = line.IndexOf(':');
            if (colonIndex <= 0)
            {
                continue;
            }

            var colonKey = line[..colonIndex].Trim();
            var colonValue = line[(colonIndex + 1)..].Trim();
            if (!string.IsNullOrWhiteSpace(colonKey) && !string.IsNullOrWhiteSpace(colonValue))
            {
                values[colonKey] = colonValue;
            }
        }

        return values;
    }
}

internal static class NativeAppleBridge
{
    private const uint Utf8Encoding = 0x08000100;
    private static readonly object Sync = new();
    private static DeviceNotificationCallback? _callbackRef;
    private static TaskCompletionSource<IntPtr>? _deviceSource;
    private static IntPtr _notificationHandle = IntPtr.Zero;
    private static bool _initialized;

    public static Dictionary<string, string> TryReadDeviceInfo(string mobileDeviceDllPath)
    {
        try
        {
            var dllDirectory = Path.GetDirectoryName(mobileDeviceDllPath);
            if (string.IsNullOrWhiteSpace(dllDirectory))
            {
                return new Dictionary<string, string>();
            }

            SetDllDirectory(dllDirectory);
            EnsureSubscription();

            var completed = Task.WhenAny(_deviceSource!.Task, Task.Delay(2500)).GetAwaiter().GetResult();
            if (completed != _deviceSource.Task || !_deviceSource.Task.IsCompletedSuccessfully)
            {
                return new Dictionary<string, string>();
            }

            var device = _deviceSource.Task.Result;
            if (device == IntPtr.Zero)
            {
                return new Dictionary<string, string>();
            }

            var connectResult = AMDeviceConnect(device);
            LastNativeConnectResult = connectResult;
            if (connectResult != 0)
            {
                return new Dictionary<string, string>();
            }

            try
            {
                var result = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                Merge(result, ReadAccessibleValues(device));

                LastNativeIsPairedResult = AMDeviceIsPaired(device);
                LastNativePairResult = AMDevicePair(device);
                LastNativeValidateResult = AMDeviceValidatePairing(device);
                var sessionResult = AMDeviceStartSession(device);
                LastNativeStartSessionResult = sessionResult;
                if (sessionResult != 0)
                {
                    return result;
                }

                try
                {
                    Merge(result, ReadSessionValues(device));
                    return result;
                }
                finally
                {
                    AMDeviceStopSession(device);
                }
            }
            finally
            {
                AMDeviceDisconnect(device);
            }
        }
        catch
        {
            return new Dictionary<string, string>();
        }
    }

    private static void EnsureSubscription()
    {
        lock (Sync)
        {
            if (_initialized)
            {
                _deviceSource = new TaskCompletionSource<IntPtr>(TaskCreationOptions.RunContinuationsAsynchronously);
                return;
            }

            _deviceSource = new TaskCompletionSource<IntPtr>(TaskCreationOptions.RunContinuationsAsynchronously);
            _callbackRef = OnDeviceNotification;
            var result = AMDeviceNotificationSubscribe(_callbackRef, 0, 0, 0, out _notificationHandle);
            _initialized = result == 0;
        }
    }

    private static void OnDeviceNotification(ref AMDeviceNotificationCallbackInfo callbackInfo, IntPtr userInfo)
    {
      if (callbackInfo.Message == 1)
      {
          _deviceSource?.TrySetResult(callbackInfo.Device);
      }
    }

    private static string GetDeviceValue(IntPtr device, string key)
    {
        IntPtr valuePtr = IntPtr.Zero;
        IntPtr descriptionPtr = IntPtr.Zero;
        IntPtr keyPtr = IntPtr.Zero;

        try
        {
            keyPtr = CFStringCreateWithCString(IntPtr.Zero, key, Utf8Encoding);
            valuePtr = AMDeviceCopyValue(device, IntPtr.Zero, keyPtr);
            if (valuePtr == IntPtr.Zero)
            {
                return string.Empty;
            }

            descriptionPtr = CFCopyDescription(valuePtr);
            if (descriptionPtr == IntPtr.Zero)
            {
                return string.Empty;
            }

            return ReadCfString(descriptionPtr).Trim('"');
        }
        finally
        {
            if (keyPtr != IntPtr.Zero)
            {
                CFRelease(keyPtr);
            }

            if (descriptionPtr != IntPtr.Zero)
            {
                CFRelease(descriptionPtr);
            }

            if (valuePtr != IntPtr.Zero)
            {
                CFRelease(valuePtr);
            }
        }
    }

    private static Dictionary<string, string> ReadAccessibleValues(IntPtr device)
    {
        return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["DeviceName"] = GetDeviceValue(device, "DeviceName"),
            ["ProductType"] = GetDeviceValue(device, "ProductType"),
            ["ProductVersion"] = GetDeviceValue(device, "ProductVersion"),
            ["UniqueDeviceID"] = GetDeviceValue(device, "UniqueDeviceID"),
            ["DeviceClass"] = GetDeviceValue(device, "DeviceClass"),
            ["HardwareModel"] = GetDeviceValue(device, "HardwareModel"),
            ["ModelNumber"] = GetDeviceValue(device, "ModelNumber"),
            ["WiFiAddress"] = GetDeviceValue(device, "WiFiAddress")
        }
        .Where(kv => !string.IsNullOrWhiteSpace(kv.Value))
        .ToDictionary(kv => kv.Key, kv => kv.Value, StringComparer.OrdinalIgnoreCase);
    }

    private static Dictionary<string, string> ReadSessionValues(IntPtr device)
    {
        return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["DeviceName"] = GetDeviceValue(device, "DeviceName"),
            ["ProductType"] = GetDeviceValue(device, "ProductType"),
            ["ProductVersion"] = GetDeviceValue(device, "ProductVersion"),
            ["SerialNumber"] = GetDeviceValue(device, "SerialNumber"),
            ["UniqueDeviceID"] = GetDeviceValue(device, "UniqueDeviceID"),
            ["InternationalMobileEquipmentIdentity"] = GetDeviceValue(device, "InternationalMobileEquipmentIdentity"),
            ["DeviceColor"] = GetDeviceValue(device, "DeviceColor"),
            ["DeviceClass"] = GetDeviceValue(device, "DeviceClass"),
            ["MobileEquipmentIdentifier"] = GetDeviceValue(device, "MobileEquipmentIdentifier"),
            ["HardwareModel"] = GetDeviceValue(device, "HardwareModel"),
            ["ModelNumber"] = GetDeviceValue(device, "ModelNumber")
        }
        .Where(kv => !string.IsNullOrWhiteSpace(kv.Value))
        .ToDictionary(kv => kv.Key, kv => kv.Value, StringComparer.OrdinalIgnoreCase);
    }

    private static void Merge(Dictionary<string, string> target, Dictionary<string, string> source)
    {
        foreach (var kv in source)
        {
            target[kv.Key] = kv.Value;
        }
    }

    private static string ReadCfString(IntPtr cfString)
    {
        if (cfString == IntPtr.Zero)
        {
            return string.Empty;
        }

        var length = CFStringGetLength(cfString);
        var maxSize = CFStringGetMaximumSizeForEncoding(length, Utf8Encoding) + 1;
        var buffer = new byte[maxSize];

        if (!CFStringGetCString(cfString, buffer, buffer.Length, Utf8Encoding))
        {
            return string.Empty;
        }

        var terminatorIndex = Array.IndexOf(buffer, (byte)0);
        var actualLength = terminatorIndex >= 0 ? terminatorIndex : buffer.Length;
        return System.Text.Encoding.UTF8.GetString(buffer, 0, actualLength);
    }

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool SetDllDirectory(string lpPathName);

    [DllImport("MobileDevice.dll", CallingConvention = CallingConvention.Cdecl)]
    private static extern int AMDeviceNotificationSubscribe(
        DeviceNotificationCallback callback,
        uint unused1,
        uint unused2,
        uint unused3,
        out IntPtr notification);

    [DllImport("MobileDevice.dll", CallingConvention = CallingConvention.Cdecl)]
    private static extern int AMDeviceConnect(IntPtr device);

    [DllImport("MobileDevice.dll", CallingConvention = CallingConvention.Cdecl)]
    private static extern int AMDeviceDisconnect(IntPtr device);

    [DllImport("MobileDevice.dll", CallingConvention = CallingConvention.Cdecl)]
    private static extern int AMDeviceIsPaired(IntPtr device);

    [DllImport("MobileDevice.dll", CallingConvention = CallingConvention.Cdecl)]
    private static extern int AMDevicePair(IntPtr device);

    [DllImport("MobileDevice.dll", CallingConvention = CallingConvention.Cdecl)]
    private static extern int AMDeviceValidatePairing(IntPtr device);

    [DllImport("MobileDevice.dll", CallingConvention = CallingConvention.Cdecl)]
    private static extern int AMDeviceStartSession(IntPtr device);

    [DllImport("MobileDevice.dll", CallingConvention = CallingConvention.Cdecl)]
    private static extern int AMDeviceStopSession(IntPtr device);

    [DllImport("MobileDevice.dll", CallingConvention = CallingConvention.Cdecl)]
    private static extern IntPtr AMDeviceCopyValue(IntPtr device, IntPtr domain, IntPtr key);

    [DllImport("CoreFoundation.dll", CallingConvention = CallingConvention.Cdecl)]
    private static extern IntPtr CFCopyDescription(IntPtr cfTypeRef);

    [DllImport("CoreFoundation.dll", CallingConvention = CallingConvention.Cdecl)]
    private static extern IntPtr CFStringCreateWithCString(IntPtr alloc, string cStr, uint encoding);

    [DllImport("CoreFoundation.dll", CallingConvention = CallingConvention.Cdecl)]
    private static extern void CFRelease(IntPtr cfTypeRef);

    [DllImport("CoreFoundation.dll", CallingConvention = CallingConvention.Cdecl)]
    private static extern int CFStringGetLength(IntPtr handle);

    [DllImport("CoreFoundation.dll", CallingConvention = CallingConvention.Cdecl)]
    private static extern int CFStringGetMaximumSizeForEncoding(int length, uint encoding);

    [DllImport("CoreFoundation.dll", CallingConvention = CallingConvention.Cdecl)]
    [return: MarshalAs(UnmanagedType.I1)]
    private static extern bool CFStringGetCString(IntPtr handle, byte[] buffer, int bufferSize, uint encoding);

    [UnmanagedFunctionPointer(CallingConvention.Cdecl)]
    private delegate void DeviceNotificationCallback(ref AMDeviceNotificationCallbackInfo callbackInfo, IntPtr userInfo);

    [StructLayout(LayoutKind.Sequential)]
    private struct AMDeviceNotificationCallbackInfo
    {
        public IntPtr Device;
        public int Message;
        public IntPtr Subscription;
    }

    public static int LastNativeConnectResult { get; private set; }
    public static int LastNativeIsPairedResult { get; private set; }
    public static int LastNativePairResult { get; private set; }
    public static int LastNativeValidateResult { get; private set; }
    public static int LastNativeStartSessionResult { get; private set; }
}
