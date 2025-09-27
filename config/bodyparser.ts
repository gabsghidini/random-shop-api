const bodyParserConfig = {
  /*
  |--------------------------------------------------------------------------
  | White listed methods
  |--------------------------------------------------------------------------
  |
  | HTTP methods for which body parsing must be performed. It is a good practice
  | to avoid body parsing for `GET` requests.
  |
  */
  whitelistedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  /*
  |--------------------------------------------------------------------------
  | JSON parser settings
  |--------------------------------------------------------------------------
  |
  | Settings for parsing JSON requests
  |
  */
  json: {
    /*
    |--------------------------------------------------------------------------
    | Enable/Disable JSON body parsing
    |--------------------------------------------------------------------------
    */
    enabled: true,

    /*
    |--------------------------------------------------------------------------
    | Maximum request size
    |--------------------------------------------------------------------------
    |
    | Define the maximum size of JSON request body. If request body is larger
    | than this value, an exception will be raised.
    |
    */
    limit: '1mb',

    /*
    |--------------------------------------------------------------------------
    | Strict parsing
    |--------------------------------------------------------------------------
    |
    | When `strict` is set to true, body parser will only parse Arrays and
    | Objects. Otherwise everything parseable by `JSON.parse` is parsed.
    |
    */
    strict: true,

    /*
    |--------------------------------------------------------------------------
    | JSON Types
    |--------------------------------------------------------------------------
    |
    | Which content types to be considered as JSON and parsed accordingly
    |
    */
    types: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report',
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Form parser settings
  |--------------------------------------------------------------------------
  |
  | Settings for parsing `application/x-www-form-urlencoded` requests
  |
  */
  form: {
    enabled: true,
    limit: '1mb',
    queryString: {},

    /*
    |--------------------------------------------------------------------------
    | Convert empty strings to null
    |--------------------------------------------------------------------------
    |
    | Convert empty form fields to null values. HTML forms results in field
    | value to be an empty string, when user doesn't fill the field. This
    | option normalizes empty strings to `null` values.
    |
    */
    convertEmptyStringsToNull: true,

    /*
    |--------------------------------------------------------------------------
    | Form Types
    |--------------------------------------------------------------------------
    |
    | Which content types to be considered as forms and parsed accordingly
    |
    */
    types: ['application/x-www-form-urlencoded'],
  },

  /*
  |--------------------------------------------------------------------------
  | Raw body parser settings
  |--------------------------------------------------------------------------
  |
  | Raw body just reads the request body as a string. This is useful when
  | request body type is not supported by bodyparser.
  |
  */
  raw: {
    enabled: true,
    limit: '1mb',
    queryString: {},
    types: ['text/*'],
  },

  /*
  |--------------------------------------------------------------------------
  | Multipart parser settings
  |--------------------------------------------------------------------------
  |
  | Settings for parsing `multipart/form-data` requests
  |
  */
  multipart: {
    /*
    |--------------------------------------------------------------------------
    | Enable/Disable multipart body parsing
    |--------------------------------------------------------------------------
    */
    enabled: true,

    /*
    |--------------------------------------------------------------------------
    | Total bytes limit
    |--------------------------------------------------------------------------
    |
    | Define the maximum size of multipart body including all files. If request
    | body is larger than this value, an exception will be raised.
    |
    */
    limit: '20mb',

    /*
    |--------------------------------------------------------------------------
    | Process manually
    |--------------------------------------------------------------------------
    |
    | Whether or not to process the multipart body manually inside the request
    | lifecycle. When value is set to `true`, then request body is not
    | processed and instead you can access `request.multipart` property
    | to process files manually.
    |
    | Make sure to set this value to `true`, when you want to process files
    | asynchronously.
    |
    */
    processManually: false,

    /*
    |--------------------------------------------------------------------------
    | Temporary file name
    |--------------------------------------------------------------------------
    |
    | Define a function to compute the temporary file name. The `filePart`
    | object contains the file name and type and you are supposed to return
    | a string
    |
    */
    tmpFileName() {
      return `${new Date().getTime()}.tmp`
    },

    /*
    |--------------------------------------------------------------------------
    | Multipart Types
    |--------------------------------------------------------------------------
    |
    | Which content types to be considered as multipart and parsed accordingly
    |
    */
    types: ['multipart/form-data'],
  },
}

export default bodyParserConfig