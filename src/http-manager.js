'use strict';

var { WebapiError, 
    WebapiRegularError, 
    WebapiAuthenticationError,
    WebapiPlayerError 
  } =  require('./response-error');

var HttpManager = {};

/* Create superagent options from the base request */
var _getParametersFromRequest = function(request) {
  var options = {};

  if (request.getQueryParameters()) {
    options.query = request.getQueryParameters();
  }

  if (request.getHeaders() && request.getHeaders()['Content-Type'] === 'application/json') {
    options.data = JSON.stringify(request.getBodyParameters());
  } else if (request.getBodyParameters()) {
    options.data = request.getBodyParameters();
  }

  if (request.getHeaders()) {
    options.headers = request.getHeaders();
  }
  return options;
};

var _toError = function(response, body) {
  if (typeof body === 'object' && body.error && typeof body.error === 'object' && body.error.reason) {
    return new WebapiPlayerError(body, response.headers, response.status);
  }

  if (typeof body === 'object' && body.error && typeof body.error === 'object') {
    return new WebapiRegularError(body, response.headers, response.status);
  }

  if (typeof body === 'object' && body.error && typeof body.error === 'string') {
    return new WebapiAuthenticationError(body, response.headers, response.status);
  }
  
  /* Other type of error, or unhandled Web API error format */
  return new WebapiError(body, response.headers, response.status, body);
};

/* Make the request to the Web API */
HttpManager._makeRequest = function(method, options, uri, callback) {
  var fetchOptions = { method: method };
  var url = uri;

  if (options.query) {
    url += `?${new URLSearchParams(options.query)}`
  }

  if (options.headers) {
    fetchOptions.headers = options.headers;
  }

  if (options.data) {
    if (options.headers['Content-Type'] === 'application/json') {
      fetchOptions.body = JSON.stringify(options.data);
    } else if (options.headers['Content-Type'] === 'application/x-www-form-urlencoded') {
      fetchOptions.body = new URLSearchParams(options.data);
    } else {
      fetchOptions.body = `${options.data}`;
    }
  }

  fetch(url, fetchOptions)
    .then(res => {
      res.text()
        .then(body => JSON.parse(body))
        .then(body => {
          if (res.status < 200 || res.status >= 400) {
            return callback(_toError(res, body))
          }

          return callback(null, {
            body: body,
            headers: res.headers,
            statusCode: res.status
          });
        })
        .catch(err => callback(err))
    })
    .catch(err => callback(err))
};

/**
 * Make a HTTP GET request.
 * @param {BaseRequest} The request.
 * @param {Function} The callback function.
 */
HttpManager.get = function(request, callback) {
  var options = _getParametersFromRequest(request);
  var method = 'GET';

  HttpManager._makeRequest(method, options, request.getURI(), callback);
};

/**
 * Make a HTTP POST request.
 * @param {BaseRequest} The request.
 * @param {Function} The callback function.
 */
HttpManager.post = function(request, callback) {
  var options = _getParametersFromRequest(request);
  var method = 'POST';

  HttpManager._makeRequest(method, options, request.getURI(), callback);
};

/**
 * Make a HTTP DELETE request.
 * @param {BaseRequest} The request.
 * @param {Function} The callback function.
 */
HttpManager.del = function(request, callback) {
  var options = _getParametersFromRequest(request);
  var method = 'DELETE';

  HttpManager._makeRequest(method, options, request.getURI(), callback);
};

/**
 * Make a HTTP PUT request.
 * @param {BaseRequest} The request.
 * @param {Function} The callback function.
 */
HttpManager.put = function(request, callback) {
  var options = _getParametersFromRequest(request);
  var method = 'PUT';

  HttpManager._makeRequest(method, options, request.getURI(), callback);
};

module.exports = HttpManager;