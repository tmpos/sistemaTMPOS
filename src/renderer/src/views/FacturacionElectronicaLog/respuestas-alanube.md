# Respuestas de Alanube (DGII)

## E32 - Factura de Consumo

```json
{
  "id": "01KVV034CWF48GX034R8GWRH68",
  "status": "REGISTERED",
  "legalStatus": "ACCEPTED_WITH_OBSERVATIONS",
  "documentNumber": "E320009645008",
  "signatureDate": "23-06-2026 15:42:38",
  "securityCode": "G8r/fK",
  "sequenceConsumed": true,
  "documentStampUrl": "https://fc.dgii.gov.do/ecf/ConsultaTimbreFC?RncEmisor=133023539&ENCF=E320009645008&MontoTotal=120&CodigoSeguridad=G8r%2FfK",
  "xml": "https://.../E320009645008.xml",
  "resumeXml": "https://.../E320009645008_resume.xml",
  "pdf": "https://.../E320009645008.pdf",
  "governmentResponse": {
    "value": [
      { "codigo": "75", "valor": "Número de secuencia no autorizada." },
      { "codigo": "3205", "valor": "El campo MontoTotal del área Totales de la sección Encabezado no es válido.El elemento MontoTotal no es correcto." }
    ],
    "code": 4
  }
}
```

## E31 - Factura de Crédito Fiscal

```json
{
  "id": "01KVV0DRMRR61RBDVEC0FPEQYY",
  "stampDate": "2026-06-23",
  "status": "REGISTERED",
  "companyIdentification": "133023539",
  "encf": "E310009645009",
  "xml": "https://.../E310009645009.xml",
  "pdf": "https://.../E310009645009.pdf",
  "documentStampUrl": "https://ecf.dgii.gov.do/ecf/ConsultaTimbre?RncEmisor=133023539&RncComprador=00000000000&ENCF=E310009645009&FechaEmision=23-06-2026&MontoTotal=141.6&FechaFirma=23-06-2026%2015:48:26&CodigoSeguridad=T0OIIk",
  "signatureDate": "23-06-2026 15:48:26",
  "securityCode": "T0OIIk",
  "sequenceConsumed": false
}
```

## Diferencias clave

| Campo | E32 (Consumo) | E31 (Fiscal) |
|-------|---------------|--------------|
| `documentNumber` | ✅ `"E320009645008"` | ❌ Usa `encf` en su lugar |
| `encf` | ❌ No existe | ✅ `"E310009645009"` |
| `legalStatus` | ✅ `"ACCEPTED_WITH_OBSERVATIONS"` | ❌ No enviado |
| `stampDate` | ❌ No existe | ✅ `"2026-06-23"` |
| `companyIdentification` | ❌ No existe | ✅ `"133023539"` |
| `resumeXml` | ✅ Incluido | ❌ No enviado |
| `governmentResponse` | ✅ Incluido | ❌ No enviado |
| `documentStampUrl` | `fc.dgii.gov.do` (consumo) | `ecf.dgii.gov.do` (fiscal) |
| `sequenceConsumed` | `true` | `false` |
