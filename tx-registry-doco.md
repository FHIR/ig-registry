# Terminology Server Registry Documentation

## Introduction 

This documents the registry-of-registries for terminology servers eco-system.

## The master registration file 

The master registration file has content like this:

```js
{
  "formatVersion" : "1", // fixed value. Mandatory
  "description" : "some description of this registry set", // purpose etc. Optional
  "documentation" : "See https://github.com/FHIR/ig-registry/blob/master/tx-registry-doco.json", // recommended reference to this page. Optional
  "registries" : [{ // list of the registries
    "code" : "code",  // code never changes - it is a persistent identifer. alphanumerics only, no spaces. Mandatory
    "name" : "Name",  // human readable name. can change, can contain any characters (including html type control chars). Mandatory
    "authority" : "Organization name", // name of publishing org. Optional
    "url" : "https://somwhere/path" // actual location of registry. May be dynamically generated. Mandatory
  }]
}
```

Notes:

* The formatVersion number is 1. This might be changed in the future if breaking changes are made to the format. 
* Each of the entries in the list of registries points to a json document as documented in the next section

There is a single master registration file at https://github.com/FHIR/ig-registry/blob/master/tx-servers.json
which is the official list of public servers for the FHIR tooling eco-system. Other master registation files 
may exist elsewhere.

## The server registries

```js
{
  "formatVersion" : "1",// fixed value. Mandatory
  "description" : "something", // purpose etc. Optional
  "servers" : [{ // list of actual servers
    "code" : "code",  // code never changes - it is a persistent identifer. alphanumerics only, no spaces. Mandatory
    "name" : "Name",  // human readable name. can change, can contain any characters (including html type control chars). Mandatory
    "access_info" : "documentation", // human readable markdown explaining how to get access to the server. Optional
    "url" : "http://server/page", // human landing page for the server. optional
    "usage" : [ // if present, a list of string usage tags for the intended use of the server. Missing means any use is appropriate. See below for uses (optional) ],
    "authoritative" : [ // a list of terminologies (or terminologies and specific versions) as FHIR canonical URI values that the server claims to be authoritative for (see below). Optional
      "http://domain/*", // simple mask, * is a wildcard which may be used as part of the terminology uri and/or the terminology version 
      "http://domain/*|1.0.0",
      "http://domain/*|1.*" 
    ],
    "fhirVersions" : [{ // list of actual endpoint by FHIR version
      "version" : "R4", // can be RX or M.n.p semver 
      "url" : "http://server/endpoint" // actual FHIR endpoint of the server for that version
    }]
  }]
}
```

Notes:

* The formatVersion number is 1. This might be changed in the future if breaking changes are made to the format.
* Servers may and often do support a terminology without claiming to be authoritative for it. Being authoritative is a human decision, so is made in the registry. See below for notes about resolving a code system
* Most servers will only have one endpoint, that is, they will only support one FHIR version, but some support more than one
* if the different endpoints have different authoritative lists, that's really different servers
* Servers endpoints must support FHIR R3 or later.
* All endpoints shall support the FHIR capabilities interaction with mode=terminology without requiring authentication (see below).

## The monitoring server

One you have the master registration file, and the other registries are in place, 
then you point a monitoring server at the master registration file. The monitoring
server scans the servers referenced from the master registration file, and maintains
a live list of the servers, their configuration, and what code systems each endpoint 
supports. Then clients that are interested in using one of the servers can interrogate
the monitoring server to see what servers exist, and where a given code system might
be resolved from.

http://tx.fhir.org maintains monitoring server at tx.fhir.org/tx-reg that is
based on https://github.com/FHIR/ig-registry/blob/master/tx-servers.json.

### Responding to the monitoring service API

The monitoring server will hit the nominated endpoint at ```/metadata``` and ```/metadata?mode=terminology```.
The endpoints must not require authentication, though the server may otherwise require
authentication, and may return more complete statements if a user is authenticated.

The following features of the responses are used:
* CapabilityStatement.fhirVersion
* CapabilityStatement.rest[mode=server].security.service 
* TerminologyCapabilities.codeSystem.uri
* TerminologyCapabilities.codeSystem.version.code

Servers should report all the code systems and versions that they support. 

#### R3

For R3, the return from ```/metadata?mode=terminology``` is a Parameters resource 
with a series of system parameters (of value uri) with sub-parts for the versions (of type code).

```json
{
  "resourceType": "Parameters",
  "parameter": [
    {
      "name": "system",
      "valueUri": "http://example.com/fhir/CodeSystem/example-code-system-1"
        "parameter": [
            {
              "name": "version",
              "valueCode": "1.0.0"
            }
        ]
    },
    {
      "name": "system",
      "valueUri": "http://example.com/fhir/CodeSystem/example-code-system-2"
        "parameter": [
            {
              "name": "version",
              "valueCode": "20230930"
            }
        ]
    }
  ]
}
```

## The monitoring server API

The monitoring server provides a public API that has two sub-functions: 

* Discovery: list known servers 
* Resolution: recommend which server to use for a code system

For tx.fhir.org, the ```root``` of this API is at http://tx.fhir.org/tx-reg/

### Discovery 

```GET {root}```

Optional parameters:

* registry: return only those endpoints that come from a nominated registry (by the code in the master registration file)
* server: return only those endpoints that have the code given
* fhirVersion: return only those endpoints that are based on the given FHIR version (RX or M.n.p)
* url: return only those endpoints that support a particular code system (by canonical, so url or url|version).
* authoritativeOnly: return only code systems which the endpoints are authoritative for (true or false; default is false)

When the ```Accept``` header is ```application/json```, the return value is a JSON object:

```js
{
  "last-update": "2023-07-24T04:12:07.710Z", // last time the registries were scanned
  "master-url": "https://raw.githubusercontent.com/FHIR/ig-registry/master/tx-servers.json", // master registry that was scanned
  "results": [{ // list of discovered endpoints
    "server-name": "human readable name",
    "server-code": "human readable name",
    "registry-name": "HL7 Terminology Services",
    "registry-code": "persistent code for the registry",
    "registry-url": "http://somewhere",
    "url": "http://server/endpoint", // actual endpoint for the server
    "fhirVersion": "4.0.1", // FHIR version - semver
    "error": "string", // details of error last time server was scanned, or null
    "last-success": int, // number of milliseconds since the server was last seen up
    "systems": int, // number of code systems found on the server
    "authoritative": [], // list of authoritative code systems as canonical values (url|version)
    "candidate": [], // list of candidate code systems as canonical values (url|version)
    "open": true // if the server supports non-authenticated use 
    "password" | "token" | "oauth" | "smart | "cert": true 
       // if the server supports authentication by one or more of those methods
  }]
}
```

Notes:

* server-X and registry-X properties are provided tor human trouble-shooting; they are not operational

### Resolution

A client can also ask which server to use for a particular code system. 

```GET {root}/resolve?fhirVersion={ver}&url={url}```

Mandatory parameters:

* fhirVersion: return only those endpoints that are based on the given FHIR version (RX or M.n.p)
* url: return only those endpoints that support a particular code system (by canonical, so url or url|version)
* authoritativeOnly: return only those endpoints that are authoritative (true or false; default is false)
* usage - see below
  
When the ```Accept``` header is ```application/json```, the return value is a JSON object:

```js
{
  "formatVersion" : version,
  "registry-url" : url,
  "authoritative" : [{
    "server-name" : "Human name for server",
    "url" : "http://server/endpoint" // actual FHIR endpoint of the server 
    "fhirVersion" : "4.0.1", // FHIR version - semver
    "open" | "password" | "token" | "oauth" | "smart | "cert": true // as above
  }],
  "candidate" : [{
    // same content as for authoritative
  }]
}
```

Notes:

* the resolve operation may return more that one server that is labelled as authoritative if the eco-system is defined that way. Resolving this is up to the client
* the resolve operation may return more than one candidate server if more than one server hosts the terminology. Resolving this is up to the client
* A server listed as authoritative won't also be listed as a candidate
* Servers are not listed as authoritative unless they actually host the code system in the request 


### Usages

If a server is marked as having a restricted use, the server will only be returned in the resolve call above if the client provides a use token that matches one of the tokens in the server's usage property (if it has any).

A client can provide a usage token with the parameter 'usage': ```GET {root}/resolve?fhirVersion={ver}&url={url}&usage=publication```

it's up to the client to provide a usage token that accurately represents it's usage. 

The open source hapi core java tools that support the ecosystem populate usage with one of three values:
* ```publication``` - the tool is publishing an IG, or building the core FHIR Specification
* ```validation``` - the tool is validating the content of a resource (this may be in production or from the command line, or validator.fhir.org)
* ```code-generation``` - the tool is generating some kind of code

The primary purpose of the usage flag is so that an administrator can deny access to the validator. This *might* be appropriate if the ecosystem is not a production grade system (e.g. tx.fhir.org) but there is concern that some users won't restrict themselves from using it operationally (which is not supported by tx.fhir.org for budget reasons)

