import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';
class SDK {
    constructor() {
        this.spec = Oas.init(definition);
        this.core = new APICore(this.spec, 'e-api-a-la-nube-dom/1.0.0 (api/6.1.3)');
    }
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    config(config) {
        this.core.setConfig(config);
    }
    /**
     * If the API you're using requires authentication you can supply the required credentials
     * through this method and the library will magically determine how they should be used
     * within your API request.
     *
     * With the exception of OpenID and MutualTLS, it supports all forms of authentication
     * supported by the OpenAPI specification.
     *
     * @example <caption>HTTP Basic auth</caption>
     * sdk.auth('username', 'password');
     *
     * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
     * sdk.auth('myBearerToken');
     *
     * @example <caption>API Keys</caption>
     * sdk.auth('myApiKey');
     *
     * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
     * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
     * @param values Your auth credentials for the API; can specify up to two strings or numbers.
     */
    auth(...values) {
        this.core.setAuth(...values);
        return this;
    }
    /**
     * If the API you're using offers alternate server URLs, and server variables, you can tell
     * the SDK which one to use with this method. To use it you can supply either one of the
     * server URLs that are contained within the OpenAPI definition (along with any server
     * variables), or you can pass it a fully qualified URL to use (that may or may not exist
     * within the OpenAPI definition).
     *
     * @example <caption>Server URL with server variables</caption>
     * sdk.server('https://{region}.api.example.com/{basePath}', {
     *   name: 'eu',
     *   basePath: 'v14',
     * });
     *
     * @example <caption>Fully qualified server URL</caption>
     * sdk.server('https://eu.api.example.com/v14');
     *
     * @param url Server URL
     * @param variables An object of variables to replace into the server URL.
     */
    server(url, variables = {}) {
        this.core.setServer(url, variables);
    }
    /**
     * Este endpoint permite dar de alta empresas en la API con las configuraciones necesarias
     * para enviar documentos a la DGII
     *
     * @summary Dar de alta a una empresa
     * @throws FetchError<400, types.CreateCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CreateCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CreateCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    createCompany(body) {
        return this.core.fetch('/company', 'post', body);
    }
    /**
     * Retorna la información de la empresa asociada al token
     *
     * @summary Consultar la información de la empresa asociada al token
     * @throws FetchError<400, types.GetSelfCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.GetSelfCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.GetSelfCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getSelfCompany() {
        return this.core.fetch('/company', 'get');
    }
    /**
     * Este endpoint permite actualizar la información de la empresa asociada al token, ten en
     * cuenta que únicamente se actualizará la información enviada y por lo tanto no es
     * necesario enviar toda la información de la empresa
     *
     * @summary Actualizar la información de una empresa asociada al token
     * @throws FetchError<400, types.UpdateSelfCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.UpdateSelfCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.UpdateSelfCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    updateSelfCompany(body) {
        return this.core.fetch('/company', 'patch', body);
    }
    /**
     * Retorna la información de la empresa enviada como parámetro
     *
     * @summary Consultar la información de una empresa
     * @throws FetchError<400, types.GetCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.GetCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.GetCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getCompany(metadata) {
        return this.core.fetch('/company/{id}', 'get', metadata);
    }
    /**
     * Este endpoint permite actualizar la información de la empresa enviada cómo parámetro,
     * ten en cuenta que únicamente se actualizará la información enviada y por lo tanto no es
     * necesario enviar toda la información de la empresa
     *
     * @summary Actualizar la información de una empresa
     * @throws FetchError<400, types.UpdateCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.UpdateCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.UpdateCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    updateCompany(body, metadata) {
        return this.core.fetch('/company/{id}', 'patch', body, metadata);
    }
    /**
     * Endpoint para generar el set de pruebas necesario para el proceso de certificación
     *
     * @summary Endpoint para generar el set de pruebas
     * @throws FetchError<400, types.CreateSetTestResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.CreateSetTestResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    createSetTest(body) {
        return this.core.fetch('/set-tests', 'post', body);
    }
    /**
     * Endpoint para para consultar el set de pruebas asociado a la compañía principal
     *
     * @summary Endpoint para consultar el set de pruebas asociado a la compañía principal
     * @throws FetchError<400, types.CheckSetTestMainCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.CheckSetTestMainCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkSetTestMainCompany(metadata) {
        return this.core.fetch('/check-set-tests/{id}', 'get', metadata);
    }
    /**
     * Endpoint para consultar el set de pruebas asociado a la compañía asociada en la url
     *
     * @summary Endpoint para consultar el set de pruebas asociado a la compañía asociada en la url
     * @throws FetchError<400, types.CheckSetTestAssociatedCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.CheckSetTestAssociatedCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkSetTestAssociatedCompany(metadata) {
        return this.core.fetch('/check-set-tests/{id}/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Firmar los documentos requeridos para el proceso de la dada de alta utilizando la
     * información de la compañía
     *
     * @summary Firmar los documentos requeridos para el proceso de la dada de alta
     */
    signDocumentCertification(body) {
        return this.core.fetch('/sign-document', 'post', body);
    }
    signDocumentCertificationByCompany(body, metadata) {
        return this.core.fetch('/sign-document/idCompany/{idCompany}', 'post', body, metadata);
    }
    /**
     * Endpoint para consultar la información del proveedor Alanube
     *
     * @summary Endpoint para consultar la información del proveedor Alanube
     */
    checkProviderInfo() {
        return this.core.fetch('/provider-info', 'get');
    }
    /**
     * Emitir Factura de Crédito Fiscal Electrónica (31)
     *
     * @summary Emitir Factura de Crédito Fiscal Electrónica (31)
     * @throws FetchError<400, types.CreateInvoiceFiscalsResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CreateInvoiceFiscalsResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CreateInvoiceFiscalsResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    createInvoiceFiscals(body) {
        return this.core.fetch('/fiscal-invoices', 'post', body);
    }
    /**
     * Consultar el estado de la Factura de Crédito Fiscal Electrónica (31)
     *
     * @summary Consultar el estado de la Factura de Crédito Fiscal Electrónica (31)
     * @throws FetchError<400, types.CheckInvoiceFiscalsResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckInvoiceFiscalsResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckInvoiceFiscalsResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkInvoiceFiscals(metadata) {
        return this.core.fetch('/fiscal-invoices/{id}', 'get', metadata);
    }
    /**
     * Consultar el estado de la Factura de Crédito Fiscal Electrónica por id e idCompany (31)
     *
     * @summary Consultar el estado de la Factura de Crédito Fiscal Electrónica por id e idCompany (31)
     * @throws FetchError<400, types.CheckInvoiceFiscalsByCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckInvoiceFiscalsByCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckInvoiceFiscalsByCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkInvoiceFiscalsByCompany(metadata) {
        return this.core.fetch('/fiscal-invoices/{id}/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Notificar por correo Factura de Crédito Fiscal Electrónica (31)
     *
     * @summary Notificar por correo Factura de Crédito Fiscal Electrónica (31)
     * @throws FetchError<400, types.NotifyByEmailInvoiceFiscalsResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.NotifyByEmailInvoiceFiscalsResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.NotifyByEmailInvoiceFiscalsResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    notifyByEmailInvoiceFiscals(body) {
        return this.core.fetch('/fiscal-invoices/notify-by-email', 'post', body);
    }
    /**
     * Emitir Factura de Consumo Electrónica (32)
     *
     * ### NOTAS
     *
     * - Se debe tener en cuenta que este endpoint puede tener dos tipos de respuesta, una
     * `síncrona` (de inmediata respuesta) cuando el total de la factura es menor a DOP$250.000
     * y otra `asíncrona` (que se debe esperar respuesta de la DGII) cuando el total de la
     * factura es mayor o igual a DOP$250.000
     * - En caso de errores de comunicación con la DGII durante una respuesta `síncrona`,
     * recibiremos y procesaremos tu solicitud de manera `asincrónica`. Así, intentaremos el
     * envío nuevamente cuando la DGII esté operativa
     *   - Obtendrás una respuesta con una propiedad llamada `response` donde vendrá la razón
     * por la cual la entidad no pudo recibir el documento junto con el código de error
     *   ```json
     *   {
     *     "response":[
     *       {
     *         "message":"The connection with DGII has timed out. We have scheduled your
     * document for automatic transmission. Check it out in a moment",
     *         "code":"AEP2006"
     *       }
     *     ]
     *   }
     *   ```
     *   - Para consultar el estado final del documento electrónico, se debe usar este
     * [endpoint](https://developer.alanube.co/v1.0-DOM/reference/checkinvoicesbycompany). O en
     * caso de tener los webhooks activados nosotros te notificaremos automáticamente
     *
     * @summary Emitir Factura de Consumo Electrónica (32)
     * @throws FetchError<400, types.CreateInvoicesResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CreateInvoicesResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CreateInvoicesResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    createInvoices(body) {
        return this.core.fetch('/invoices', 'post', body);
    }
    /**
     * Consultar el estado de la factura de consumo electrónica (32)
     *
     * @summary Consultar el estado de la factura de consumo electrónica (32)
     * @throws FetchError<400, types.CheckInvoicesResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckInvoicesResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckInvoicesResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkInvoices(metadata) {
        return this.core.fetch('/invoices/{id}', 'get', metadata);
    }
    /**
     * Consultar el estado de la factura de consumo electrónica por id e idCompany (32)
     *
     * @summary Consultar el estado de la factura de consumo electrónica por id e idCompany (32)
     * @throws FetchError<400, types.CheckInvoicesByCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckInvoicesByCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckInvoicesByCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkInvoicesByCompany(metadata) {
        return this.core.fetch('/invoices/{id}/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Notificar por correo Factura de Consumo Electrónica (32)
     *
     * @summary Notificar por correo Factura de Consumo Electrónica (32)
     * @throws FetchError<400, types.NotifyByEmailInvoicesResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.NotifyByEmailInvoicesResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.NotifyByEmailInvoicesResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    notifyByEmailInvoices(body) {
        return this.core.fetch('/invoices/notify-by-email', 'post', body);
    }
    /**
     * Emitir Nota de Débito Electrónica (33)
     *
     * @summary Emitir Nota de Débito Electrónica (33)
     * @throws FetchError<400, types.CreateDebitNotesResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CreateDebitNotesResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CreateDebitNotesResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    createDebitNotes(body) {
        return this.core.fetch('/debit-notes', 'post', body);
    }
    /**
     * Consultar el estado de la Nota de Débito Electrónica (33)
     *
     * @summary Consultar el estado de la Nota de Débito Electrónica (33)
     * @throws FetchError<400, types.CheckDebitNotesResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckDebitNotesResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckDebitNotesResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkDebitNotes(metadata) {
        return this.core.fetch('/debit-notes/{id}', 'get', metadata);
    }
    /**
     * Consultar el estado de la Nota de Débito Electrónica por id e idCompany (33)
     *
     * @summary Consultar el estado de la Nota de Débito Electrónica por id e idCompany (33)
     * @throws FetchError<400, types.CheckDebitNotesByCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckDebitNotesByCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckDebitNotesByCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkDebitNotesByCompany(metadata) {
        return this.core.fetch('/debit-notes/{id}/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Notificar por correo Nota de Débito Electrónica (33)
     *
     * @summary Notificar por correo Nota de Débito Electrónica (33)
     * @throws FetchError<400, types.NotifyByEmailDebitNotesResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.NotifyByEmailDebitNotesResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.NotifyByEmailDebitNotesResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    notifyByEmailDebitNotes(body) {
        return this.core.fetch('/debit-notes/notify-by-email', 'post', body);
    }
    /**
     * Emitir Nota de Crédito Electrónica (34)
     *
     * @summary Emitir Nota de Crédito Electrónica (34)
     * @throws FetchError<400, types.CreateCreditNotesResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CreateCreditNotesResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CreateCreditNotesResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    createCreditNotes(body) {
        return this.core.fetch('/credit-notes', 'post', body);
    }
    /**
     * Consultar el estado de Nota de Crédito Electrónica (34)
     *
     * @summary Consultar el estado de Nota de Crédito Electrónica (34)
     * @throws FetchError<400, types.CheckCreditNotesResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckCreditNotesResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckCreditNotesResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkCreditNotes(metadata) {
        return this.core.fetch('/credit-notes/{id}', 'get', metadata);
    }
    /**
     * Consultar el estado de Nota de Crédito Electrónica por id e idCompany (34)
     *
     * @summary Consultar el estado de Nota de Crédito Electrónica por id e idCompany (34)
     * @throws FetchError<400, types.CheckCreditNotesByCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckCreditNotesByCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckCreditNotesByCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkCreditNotesByCompany(metadata) {
        return this.core.fetch('/credit-notes/{id}/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Notificar por correo Nota de Crédito Electrónica (34)
     *
     * @summary Notificar por correo Nota de Crédito Electrónica (34)
     * @throws FetchError<400, types.NotifyByEmailCreditNotesResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.NotifyByEmailCreditNotesResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.NotifyByEmailCreditNotesResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    notifyByEmailCreditNotes(body) {
        return this.core.fetch('/credit-notes/notify-by-email', 'post', body);
    }
    /**
     * Emitir Compras Electrónicas (41)
     *
     * @summary Emitir Compras Electrónicas (41)
     * @throws FetchError<400, types.CreatePurchasesResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CreatePurchasesResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CreatePurchasesResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    createPurchases(body) {
        return this.core.fetch('/purchases', 'post', body);
    }
    /**
     * Consultar el estado de Compras Electrónicas (41)
     *
     * @summary Consultar el estado de Compras Electrónicas (41)
     * @throws FetchError<400, types.CheckPurchasesResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckPurchasesResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckPurchasesResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkPurchases(metadata) {
        return this.core.fetch('/purchases/{id}', 'get', metadata);
    }
    /**
     * Consultar el estado de Compras Electrónicas por id e idCompany (41)
     *
     * @summary Consultar el estado de Compras Electrónicas por id e idCompany (41)
     * @throws FetchError<400, types.CheckPurchasesByCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckPurchasesByCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckPurchasesByCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkPurchasesByCompany(metadata) {
        return this.core.fetch('/purchases/{id}/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Notificar por correo Compras Electrónicas (41)
     *
     * @summary Notificar por correo Compras Electrónicas (41)
     * @throws FetchError<400, types.NotifyByEmailPurchasesResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.NotifyByEmailPurchasesResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.NotifyByEmailPurchasesResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    notifyByEmailPurchases(body) {
        return this.core.fetch('/purchases/notify-by-email', 'post', body);
    }
    /**
     * Emitir Gastos Menores Electrónico (43)
     *
     * @summary Emitir Gastos Menores Electrónico (43)
     * @throws FetchError<400, types.CreateMinorExpensesResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CreateMinorExpensesResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CreateMinorExpensesResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    createMinorExpenses(body) {
        return this.core.fetch('/minor-expenses', 'post', body);
    }
    /**
     * Consultar el estado de Gastos Menores Electrónico (43)
     *
     * @summary Consultar el estado de Gastos Menores Electrónico (43)
     * @throws FetchError<400, types.CheckMinorExpensesResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckMinorExpensesResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckMinorExpensesResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkMinorExpenses(metadata) {
        return this.core.fetch('/minor-expenses/{id}', 'get', metadata);
    }
    /**
     * Consultar el estado de Gastos Menores Electrónico por id e idCompany (43)
     *
     * @summary Consultar el estado de Gastos Menores Electrónico por id e idCompany (43)
     * @throws FetchError<400, types.CheckMinorExpensesByCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckMinorExpensesByCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckMinorExpensesByCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkMinorExpensesByCompany(metadata) {
        return this.core.fetch('/minor-expenses/{id}/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Emitir factura para Regímenes Especiales Electrónico (44)
     *
     * @summary Emitir factura para Regímenes Especiales Electrónico (44)
     * @throws FetchError<400, types.CreateSpecialRegimesResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CreateSpecialRegimesResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CreateSpecialRegimesResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    createSpecialRegimes(body) {
        return this.core.fetch('/special-regimes', 'post', body);
    }
    /**
     * Consultar el estado de facturas para Regímenes Especiales Electrónico (44)
     *
     * @summary Consultar el estado de facturas para Regímenes Especiales Electrónico (44)
     * @throws FetchError<400, types.CheckSpecialRegimesResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckSpecialRegimesResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckSpecialRegimesResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkSpecialRegimes(metadata) {
        return this.core.fetch('/special-regimes/{id}', 'get', metadata);
    }
    /**
     * Consultar el estado de facturas para Regímenes Especiales Electrónico por id e idCompany
     * (44)
     *
     * @summary Consultar el estado de facturas para Regímenes Especiales Electrónico por id e idCompany
     * (44)
     * @throws FetchError<400, types.CheckSpecialRegimesByCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckSpecialRegimesByCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckSpecialRegimesByCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkSpecialRegimesByCompany(metadata) {
        return this.core.fetch('/special-regimes/{id}/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Notificar por correo Regímenes Especiales Electrónico (44)
     *
     * @summary Notificar por correo Regímenes Especiales Electrónico (44)
     * @throws FetchError<400, types.NotifyByEmailSpecialRegimesResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.NotifyByEmailSpecialRegimesResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.NotifyByEmailSpecialRegimesResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    notifyByEmailSpecialRegimes(body) {
        return this.core.fetch('/special-regimes/notify-by-email', 'post', body);
    }
    /**
     * Emitir facturas Gubernamentales Electrónicas (45)
     *
     * @summary Emitir facturas Gubernamentales Electrónicas (45)
     * @throws FetchError<400, types.CreateGubernamentalsResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CreateGubernamentalsResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CreateGubernamentalsResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    createGubernamentals(body) {
        return this.core.fetch('/gubernamentals', 'post', body);
    }
    /**
     * Consultar el estado de facturas Gubernamentales Electrónicas (45)
     *
     * @summary Consultar el estado de facturas Gubernamentales Electrónicas (45)
     * @throws FetchError<400, types.CheckGubernamentalsResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckGubernamentalsResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckGubernamentalsResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkGubernamentals(metadata) {
        return this.core.fetch('/gubernamentals/{id}', 'get', metadata);
    }
    /**
     * Consultar el estado de la factura Gubernamental Electrónica por id e idCompany (45)
     *
     * @summary Consultar el estado de la factura Gubernamental Electrónica por id e idCompany (45)
     * @throws FetchError<400, types.CheckGubernamentalsByCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckGubernamentalsByCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckGubernamentalsByCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkGubernamentalsByCompany(metadata) {
        return this.core.fetch('/gubernamentals/{id}/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Notificar por correo Gubernamentales Electrónicas (45)
     *
     * @summary Notificar por correo Gubernamentales Electrónicas (45)
     * @throws FetchError<400, types.NotifyByEmailGubernamentalsResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.NotifyByEmailGubernamentalsResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.NotifyByEmailGubernamentalsResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    notifyByEmailGubernamentals(body) {
        return this.core.fetch('/gubernamentals/notify-by-email', 'post', body);
    }
    /**
     * Emitir Facturas de Exportación Electrónica (46)
     *
     * @summary Emitir Facturas de Exportación Electrónica (46)
     * @throws FetchError<400, types.CreateExportSupportsResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CreateExportSupportsResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CreateExportSupportsResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    createExportSupports(body) {
        return this.core.fetch('/export-supports', 'post', body);
    }
    /**
     * Consultar el estado de la factura de Exportación Electrónica (46)
     *
     * @summary Consultar el estado de la factura de Exportación Electrónica (46)
     * @throws FetchError<400, types.CheckExportSupportsResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckExportSupportsResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckExportSupportsResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkExportSupports(metadata) {
        return this.core.fetch('/export-supports/{id}', 'get', metadata);
    }
    /**
     * Consultar el estado la factura de Exportación Electrónico por id e idCompany (46)
     *
     * @summary Consultar el estado la factura de Exportación Electrónico por id e idCompany (46)
     * @throws FetchError<400, types.CheckExportSupportsByCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckExportSupportsByCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckExportSupportsByCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkExportSupportsByCompany(metadata) {
        return this.core.fetch('/export-supports/{id}/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Notificar por correo Facturas de Exportación Electrónica (46)
     *
     * @summary Notificar por correo Facturas de Exportación Electrónica (46)
     * @throws FetchError<400, types.NotifyByEmailExportSupportsResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.NotifyByEmailExportSupportsResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.NotifyByEmailExportSupportsResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    notifyByEmailExportSupports(body) {
        return this.core.fetch('/export-supports/notify-by-email', 'post', body);
    }
    /**
     * Emitir Comprobante para Pagos al Exterior Electrónico (47)
     *
     * @summary Emitir Comprobante para Pagos al Exterior Electrónico (47)
     * @throws FetchError<400, types.CreatePaymentAbroadSupportsResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CreatePaymentAbroadSupportsResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CreatePaymentAbroadSupportsResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    createPaymentAbroadSupports(body) {
        return this.core.fetch('/payment-abroad-supports', 'post', body);
    }
    /**
     * Consultar el estado del Comprobante para Pagos al Exterior Electrónico (47)
     *
     * @summary Consultar el estado del Comprobante para Pagos al Exterior Electrónico (47)
     * @throws FetchError<400, types.CheckPaymentAbroadSupportsResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckPaymentAbroadSupportsResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckPaymentAbroadSupportsResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkPaymentAbroadSupports(metadata) {
        return this.core.fetch('/payment-abroad-supports/{id}', 'get', metadata);
    }
    /**
     * Consultar el estado del Comprobante para Pagos al Exterior Electrónico por id e
     * idCompany (47)
     *
     * @summary Consultar el estado del Comprobante para Pagos al Exterior Electrónico por id e
     * idCompany (47)
     * @throws FetchError<400, types.CheckPaymentAbroadSupportsByCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckPaymentAbroadSupportsByCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckPaymentAbroadSupportsByCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkPaymentAbroadSupportsByCompany(metadata) {
        return this.core.fetch('/payment-abroad-supports/{id}/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Este endpoint sirver para emitir anulaciones, las cuales se usan para anular rangos de
     * numeración que no se usarán.
     *
     * @summary Emitir anulaciones
     * @throws FetchError<400, types.CreateCancelationsResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.CreateCancelationsResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    createCancelations(body) {
        return this.core.fetch('/cancellations', 'post', body);
    }
    /**
     * Consultar el estado de la anulación
     *
     * @summary Consultar el estado de la anulación
     * @throws FetchError<400, types.CheckCancelationsResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckCancelationsResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckCancelationsResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkCancelations(metadata) {
        return this.core.fetch('/cancellations/{id}', 'get', metadata);
    }
    /**
     * Consultar el estado la anulación por id e idCompany
     *
     * @summary Consultar el estado la anulación por id e idCompany
     * @throws FetchError<400, types.CheckCancelationsByCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.CheckCancelationsByCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.CheckCancelationsByCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkCancelationsByCompany(metadata) {
        return this.core.fetch('/cancellations/{id}/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Consultar el directorio de compañías activas para facturación electrónica.
     *
     * ### NOTAS
     *
     * - En el ambiente sandbox, recibirás un listado que mostrará exclusivamente las URLs
     * correspondientes a la DGII.
     * - En el ambiente de producción, recibirás un listado que incluirá únicamente las
     * compañías activas para facturación electrónica.
     *
     * @summary Consultar el directorio de compañías activas para facturación electrónica
     * @throws FetchError<404, types.CheckDirectoryResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado la
     * compañía con la que se intenta consultar
     * @throws FetchError<500, types.CheckDirectoryResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkDirectory(metadata) {
        return this.core.fetch('/check-directory', 'get', metadata);
    }
    /**
     * Consultar el directorio de compañías activas para facturación electrónica por idCompany.
     *
     * ### NOTAS
     *
     * - En el ambiente sandbox, recibirás un listado que mostrará exclusivamente las URLs
     * correspondientes a la DGII.
     * - En el ambiente de producción, recibirás un listado que incluirá únicamente las
     * compañías activas para facturación electrónica.
     *
     * @summary Consultar el directorio de compañías activas para facturación electrónica por idCompany
     * @throws FetchError<404, types.CheckDirectoryByCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado la
     * compañía con la que se intenta consultar
     * @throws FetchError<500, types.CheckDirectoryByCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkDirectoryByCompany(metadata) {
        return this.core.fetch('/check-directory/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Consultar estado de la API DGII
     *
     * @summary Consultar estado de la API DGII
     * @throws FetchError<404, types.CheckDgiiStatusResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado la
     * compañía con la que se intenta consultar
     * @throws FetchError<500, types.CheckDgiiStatusResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkDgiiStatus(metadata) {
        return this.core.fetch('/check-dgii-status', 'get', metadata);
    }
    /**
     * Consultar el estado de la DGII por idCompany
     *
     * @summary Consultar el estado de la DGII por idCompany
     * @throws FetchError<404, types.CheckDgiiStatusByCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado la
     * compañía con la que se intenta consultar
     * @throws FetchError<500, types.CheckDgiiStatusByCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    checkDgiiStatusByCompany(metadata) {
        return this.core.fetch('/check-dgii-status/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Endpoint que permite consultar el listado de documentos recibidos de la compañía
     * asociada al token
     *
     * ### NOTAS
     *
     * - Por defecto toda la información está ordenada por fecha de emisión
     * (`documentStampDate`) de forma descendente; es decir, los documentos recibidos más
     * recientes aparecerán primero
     *
     * @summary Consultar documentos recibidos asociados al token
     * @throws FetchError<400, types.GetReceivedDocumentsResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.GetReceivedDocumentsResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getReceivedDocuments(metadata) {
        return this.core.fetch('/received-documents', 'get', metadata);
    }
    /**
     * Endpoint que permite consultar el listado de documentos recibidos de la compañía
     * asociada al idCompany.
     *
     * ### NOTAS
     *
     * - Por defecto toda la información está ordenada por fecha de emisión
     * (`documentStampDate`) de forma descendente; es decir, los documentos recibidos más
     * recientes aparecerán primero
     *
     * @summary Consultar documentos recibidos asociados al idCompany
     * @throws FetchError<400, types.GetReceivedDocumentsIdcompanyIdcompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.GetReceivedDocumentsIdcompanyIdcompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getReceivedDocumentsIdcompanyIdcompany(metadata) {
        return this.core.fetch('/received-documents/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Endpoint que permite consultar un documento electrónico recibido por su id
     *
     * @summary Consultar documento recibido por id
     * @throws FetchError<400, types.GetReceivedDocumentsIdResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.GetReceivedDocumentsIdResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getReceivedDocumentsId(metadata) {
        return this.core.fetch('/received-documents/{id}', 'get', metadata);
    }
    /**
     * Endpoint que permite consultar un documento electrónico recibido por su id e idCompany
     *
     * @summary Consultar documento recibido por id e idCompany
     * @throws FetchError<400, types.GetReceivedDocumentsIdIdcompanyIdcompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.GetReceivedDocumentsIdIdcompanyIdcompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getReceivedDocumentsIdIdcompanyIdcompany(metadata) {
        return this.core.fetch('/received-documents/{id}/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Endpoint que permite consultar el listado de aprobaciones comerciales recibidas de la
     * compañía asociada al token
     *
     * @summary Consultar aprobaciones comerciales recibidas asociadas al token
     * @throws FetchError<400, types.GetReceivedCommercialApprovalsResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.GetReceivedCommercialApprovalsResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getReceivedCommercialApprovals(metadata) {
        return this.core.fetch('/received-commercial-approvals', 'get', metadata);
    }
    /**
     * Endpoint que permite consultar el listado de aprobaciones comerciales recibidas de la
     * compañía asociada al idCompany
     *
     * @summary Consultar aprobaciones comerciales recibidas asociadas al idCompany
     * @throws FetchError<400, types.GetReceivedCommercialApprovalsIdcompanyIdcompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.GetReceivedCommercialApprovalsIdcompanyIdcompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getReceivedCommercialApprovalsIdcompanyIdcompany(metadata) {
        return this.core.fetch('/received-commercial-approvals/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Endpoint que permite consultar una aprobación comercial recibida por su id
     *
     * @summary Consultar aprobación comercial recibida por id
     * @throws FetchError<400, types.GetReceivedCommercialApprovalsIdResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.GetReceivedCommercialApprovalsIdResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getReceivedCommercialApprovalsId(metadata) {
        return this.core.fetch('/received-commercial-approvals/{id}', 'get', metadata);
    }
    /**
     * Endpoint que permite consultar una aprobación comercial recibida por su id e idCompany
     *
     * @summary Consultar aprobación comercial recibida por id e idCompany
     * @throws FetchError<400, types.GetReceivedCommercialApprovalsIdIdcompanyIdcompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.GetReceivedCommercialApprovalsIdIdcompanyIdcompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getReceivedCommercialApprovalsIdIdcompanyIdcompany(metadata) {
        return this.core.fetch('/received-commercial-approvals/{id}/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Endpoint que permite consultar un acuse de recibo relacionado a una compañía por su id
     * Un acuse de recibo es una confirmación enviada por el receptor al emisor para indicar
     * que el comprobante fiscal electrónico (e-CF) ha sido recibido.
     * El acuse no implica aceptación o rechazo del e-CF, solo confirma la recepción del
     * documento.
     *
     * ## Ejemplo de uso
     *
     * - Eres un `emisor` que realizó una [factura de crédito fiscal -
     * E31](https://developer.alanube.co/v1.0-DOM/reference/createinvoicefiscals)
     * a un cliente, que actúa como `receptor`. Este receptor debe de estar registrado en el
     * directorio de compañías activas para facturación electrónica y es responsable de
     * devolver un acuse de recibo.
     * Puedes consultar el estado de los acuses de recibo relacionados a tu compañía mediante
     * este endpoint.
     *
     * @summary Consultar un acuse de recibo externo por id
     * @throws FetchError<400, types.GetReceptionAcknowledgmentsIdcompanyIdResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.GetReceptionAcknowledgmentsIdcompanyIdResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getReceptionAcknowledgmentsIdcompanyId(metadata) {
        return this.core.fetch('/reception/acknowledgments/{idCompany}/{id}', 'get', metadata);
    }
    /**
     * Este endpoint permite consultar los acuses de recibo relacionados a una compañía.
     * Un acuse de recibo es una confirmación enviada por el receptor al emisor para indicar
     * que el comprobante fiscal electrónico (e-CF) ha sido recibido.
     * El acuse no implica aceptación o rechazo del e-CF, solo confirma la recepción del
     * documento.
     *
     * ## Ejemplo de uso
     *
     * - Eres un `emisor` que realizó una [factura de crédito fiscal -
     * E31](https://developer.alanube.co/v1.0-DOM/reference/createinvoicefiscals)
     * a un cliente, que actúa como `receptor`. Este receptor debe de estar registrado en el
     * directorio de compañías activas para facturación electrónica y es responsable de
     * devolver un acuse de recibo.
     * Puedes consultar el estado de los acuses de recibo relacionados a tu compañía mediante
     * este endpoint.
     *
     * ### NOTAS
     *
     * - Por defecto toda la información está ordenada por fecha de creación de forma
     * descendente; es decir, los acuses de recibo más recientes aparecerán primero
     * - Unicamente aparecerán acuses de recibo siempre y cuando los documentos emitidos hayan
     * sido `ACEPTADOS` por la DGII
     *
     * @summary Consultar acuses de recibo externos
     * @throws FetchError<400, types.GetReceptionAcknowledgmentsIdcompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.GetReceptionAcknowledgmentsIdcompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getReceptionAcknowledgmentsIdcompany(metadata) {
        return this.core.fetch('/reception/acknowledgments/{idCompany}', 'get', metadata);
    }
    /**
     * Endpoint que permite consultar un acuse de recibo interno relacionado a una compañía por
     * su id.
     * Un acuse de recibo es una confirmación enviada por el receptor al emisor para indicar
     * que el comprobante fiscal electrónico (e-CF) ha sido recibido.
     * El acuse no implica aceptación o rechazo del e-CF, solo confirma la recepción del
     * documento.
     *
     * ## Ejemplo de uso
     *
     * - En este caso, un emisor externo envió un documento electrónico a tu compañía, la cual
     * actúa como receptor. Este emisor externo recibió un acuse de recibo de forma automática
     * por parte de nosotros. Entonces por medio de este endpoint puedes consultar el estado de
     * los acuses de recibo que estamos respondiendo a emisores externos relacionados a tu
     * compañía.
     *
     * @summary Consultar un acuse de recibo interno por id
     * @throws FetchError<400, types.GetReceptionReceiptsIdcompanyIdResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.GetReceptionReceiptsIdcompanyIdResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getReceptionReceiptsIdcompanyId(metadata) {
        return this.core.fetch('/reception/receipts/{idCompany}/{id}', 'get', metadata);
    }
    /**
     * Este endpoint permite consultar los acuses de recibo relacionados a una compañía.
     * Un acuse de recibo es una confirmación enviada por el receptor al emisor para indicar
     * que el comprobante fiscal electrónico (e-CF) ha sido recibido.
     * El acuse no implica aceptación o rechazo del e-CF, solo confirma la recepción del
     * documento.
     *
     * ## Ejemplo de uso
     *
     * - Eres un `receptor` que recibió un documento electrónico de un `emisor` externo. Este
     * emisor externo recibió un acuse de recibo de forma automática por parte de nosotros.
     * Entonces por medio de este endpoint puedes consultar el estado de los acuses de recibo
     * que estamos respondiendo a emisores externos relacionados a tu compañía.
     *
     * ### NOTAS
     *
     * - Por defecto toda la información está ordenada por fecha de creación de forma
     * descendente; es decir, los acuses de recibo más recientes aparecerán primero
     *
     * @summary Consultar acuses de recibo internos
     * @throws FetchError<400, types.GetReceptionReceiptsIdcompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.GetReceptionReceiptsIdcompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getReceptionReceiptsIdcompany(metadata) {
        return this.core.fetch('/reception/receipts/{idCompany}', 'get', metadata);
    }
    /**
     * Endpoint que permite generar una respuesta comercial para un documento dado
     *
     * @summary Generar respuesta comercial asociada al id del documento
     * @throws FetchError<400, types.PostReceivedDocumentsIdCommercialResponseResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.PostReceivedDocumentsIdCommercialResponseResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    postReceivedDocumentsIdCommercialResponse(body, metadata) {
        return this.core.fetch('/received-documents/{id}/commercial-response', 'post', body, metadata);
    }
    /**
     * Endpoint que permite generar una respuesta comercial para un documento y compañía dados
     *
     * @summary Generar respuesta comercial asociada al id del documento e idCompany
     * @throws FetchError<400, types.PostReceivedDocumentsIdCommercialResponseIdcompanyIdcompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.PostReceivedDocumentsIdCommercialResponseIdcompanyIdcompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    postReceivedDocumentsIdCommercialResponseIdcompanyIdcompany(body, metadata) {
        return this.core.fetch('/received-documents/{id}/commercial-response/idCompany/{idCompany}', 'post', body, metadata);
    }
    /**
     * Endpoint que permite simular la recepción de un documento desde la DGII, nosotros la
     * compañía seriamos el `receptor` y la DGII seria el `emisor`
     *
     * ### NOTAS
     *
     * - Este endpoint es solo para `pruebas`
     * - En caso de que todo haya salido OK, obtendrás la respuesta de la DGII que sería un
     * status code 201 y un body vacío
     *   - Si todo está OK, deberías de tener un nuevo documento en tu buzón de documentos
     * electrónicos que puedes consultar en este
     * [endpoint](https://developer.alanube.co/v1.0-DOM/reference/get_received-documents-idcompany-idcompany)
     * - En caso de que ocurra un error obtendrás otro status code y un body con el error
     *
     * @summary Recibir un documento electrónico (eCF) de la DGII
     * @throws FetchError<400, types.PostReceptionDgiiReceiveDocumentResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.PostReceptionDgiiReceiveDocumentResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    postReceptionDgiiReceiveDocument(body) {
        return this.core.fetch('/reception/dgii/receive-document', 'post', body);
    }
    /**
     * Endpoint que permite consultar una aprobación comercial generada por su id
     *
     * @summary Consultar aprobación comercial generada por id
     * @throws FetchError<400, types.GetCommercialApprovalsIdResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.GetCommercialApprovalsIdResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getCommercialApprovalsId(metadata) {
        return this.core.fetch('/commercial-approvals/{id}', 'get', metadata);
    }
    /**
     * Endpoint que permite consultar una aprobación comercial generada por su id e idCompany
     *
     * @summary Consultar aprobación comercial generada por id e idCompany
     * @throws FetchError<400, types.GetCommercialApprovalsIdIdcompanyIdcompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<500, types.GetCommercialApprovalsIdIdcompanyIdcompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getCommercialApprovalsIdIdcompanyIdcompany(metadata) {
        return this.core.fetch('/commercial-approvals/{id}/idCompany/{idCompany}', 'get', metadata);
    }
    /**
     * Obtiene el total de documentos electrónicos emitidos por una compañía específica en un
     * rango de fechas y estados legales determinados.
     *
     * ### NOTAS
     *
     * - Por defecto se consultan los últimos 30 días si no se especifican fechas
     * - Se pueden filtrar por estados legales específicos
     *
     * @summary Obtener total de documentos emitidos por compañía
     * @throws FetchError<400, types.GetTotalDocumentsByCompanyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.GetTotalDocumentsByCompanyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.GetTotalDocumentsByCompanyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getTotalDocumentsByCompany(metadata) {
        return this.core.fetch('/reports/companies/{idCompany}/documents/total', 'get', metadata);
    }
    /**
     * Obtiene el total de documentos electrónicos emitidos por el usuario autenticado en un
     * rango de fechas y estados legales determinados.
     *
     * ### NOTAS
     *
     * - Por defecto se consultan los últimos 30 días si no se especifican fechas
     * - Se consultan todos los documentos asociados a la compañía principal del usuario
     *
     * @summary Obtener total de documentos emitidos por usuario
     * @throws FetchError<400, types.GetTotalDocumentsByUserResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.GetTotalDocumentsByUserResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.GetTotalDocumentsByUserResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getTotalDocumentsByUser(metadata) {
        return this.core.fetch('/reports/users/documents/total', 'get', metadata);
    }
    /**
     * Consulta el total de documentos electrónicos emitidos por una compañía específica.
     *
     * ### NOTAS
     *
     * - Este endpoint proporciona estadísticas generales de emisión de documentos
     *
     * @summary Consultar total de documentos emitidos por compañía
     * @throws FetchError<400, types.GetEmittedDocumentsResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.GetEmittedDocumentsResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.GetEmittedDocumentsResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getEmittedDocuments(metadata) {
        return this.core.fetch('/companies/{id}/emitted-documents', 'get', metadata);
    }
    /**
     * Consulta el total de documentos electrónicos aceptados por la DGII para una compañía
     * específica.
     *
     * ### NOTAS
     *
     * - Este endpoint proporciona estadísticas de documentos que han sido aceptados
     * exitosamente
     *
     * @summary Consultar total de documentos aceptados por compañía
     * @throws FetchError<400, types.GetAcceptedDocumentsResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.GetAcceptedDocumentsResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.GetAcceptedDocumentsResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getAcceptedDocuments(metadata) {
        return this.core.fetch('/companies/{id}/accepted-documents', 'get', metadata);
    }
    /**
     * Consulta el total de documentos electrónicos emitidos por una compañía específica
     * durante los últimos 12 meses.
     *
     * ### NOTAS
     *
     * - Los datos se agrupan por mes para mostrar tendencias temporales
     * - Útil para análisis de comportamiento de emisión a lo largo del tiempo
     *
     * @summary Consultar total de documentos emitidos por compañía (últimos 12 meses)
     * @throws FetchError<400, types.GetEmittedDocumentsMonthlyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.GetEmittedDocumentsMonthlyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.GetEmittedDocumentsMonthlyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getEmittedDocumentsMonthly(metadata) {
        return this.core.fetch('/companies/{id}/emitted-documents/monthly', 'get', metadata);
    }
    /**
     * Consulta el total de documentos electrónicos aceptados por la DGII para una compañía
     * específica durante los últimos 12 meses.
     *
     * ### NOTAS
     *
     * - Los datos se agrupan por mes para mostrar tendencias temporales
     * - Útil para análisis de tasa de aceptación a lo largo del tiempo
     *
     * @summary Consultar total de documentos aceptados por compañía (últimos 12 meses)
     * @throws FetchError<400, types.GetAcceptedDocumentsMonthlyResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.GetAcceptedDocumentsMonthlyResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.GetAcceptedDocumentsMonthlyResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getAcceptedDocumentsMonthly(metadata) {
        return this.core.fetch('/companies/{id}/accepted-documents/monthly', 'get', metadata);
    }
    /**
     * Consulta el total de documentos electrónicos emitidos por una compañía específica
     * durante los últimos 15 días.
     *
     * ### NOTAS
     *
     * - Proporciona una vista reciente de la actividad de emisión
     * - Útil para monitoreo de actividad reciente
     *
     * @summary Consultar total de documentos emitidos por compañía (últimos 15 días)
     * @throws FetchError<400, types.GetEmittedDocuments15DaysResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.GetEmittedDocuments15DaysResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.GetEmittedDocuments15DaysResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getEmittedDocuments15Days(metadata) {
        return this.core.fetch('/companies/{id}/emitted-documents/15-days', 'get', metadata);
    }
    /**
     * Consulta el total de documentos electrónicos aceptados por la DGII para una compañía
     * específica durante los últimos 15 días.
     *
     * ### NOTAS
     *
     * - Proporciona una vista reciente de documentos aceptados exitosamente
     * - Útil para monitoreo de tasa de aceptación reciente
     *
     * @summary Consultar total de documentos aceptados por compañía (últimos 15 días)
     * @throws FetchError<400, types.GetAcceptedDocuments15DaysResponse400> Objeto que representa una respuesta de error por validaciones
     * @throws FetchError<404, types.GetAcceptedDocuments15DaysResponse404> Objeto que representa una respuesta de error debido a que no se ha encontrado el
     * recurso al que se intenta acceder
     * @throws FetchError<500, types.GetAcceptedDocuments15DaysResponse500> Objeto que representa una respuesta de error por qué ha ocurrido un error interno en el
     * sistema
     */
    getAcceptedDocuments15Days(metadata) {
        return this.core.fetch('/companies/{id}/accepted-documents/15-days', 'get', metadata);
    }
}
const createSDK = (() => { return new SDK(); })();
export default createSDK;
