# HL7 Terminology Server Ecosystem

This respository - specifically https://fhir.github.io/ig-registry/tx-servers.json - is the 
base for the *HL7* terminology server ecosystem.

How terminology ecosystems work - the registration file formats, the coordination server and its
API, and the requirements for the servers - is defined by the [FHIR Terminology Ecosystem IG](http://hl7.org/fhir/uv/tx-ecosystem), 
in particular its [Ecosystem page](http://hl7.org/fhir/uv/tx-ecosystem/ecosystem.html), and supported 
by it's [test cases](http://hl7.org/fhir/uv/tx-ecosystem/testcases.html).

This page only documents HL7's own ecosystem, the one used by the FHIR tools: where it is, and how to register a server in it.

## Locations

* Master registration file: <https://fhir.github.io/ig-registry/tx-servers.json> (`tx-servers.json` in this repository)
* Server registries: the `*-tx-servers.json` files in this repository - `hl7-tx-servers.json` for HL7
  International, and one per HL7 affiliate (`hl7-au-tx-servers.json`, `hl7-eu-tx-servers.json`, etc.),
  as listed in the master registration file
* Coordination server: <http://ecosystem.hl7.org/tx-reg>

The HL7 ecosystem exists to support design time and publication usage by the FHIR tools. It is not
intended to support production use, and should not be used in operational systems. This is not a 
limitation of the ecosystem, but a rule concerning the public terminology services that are in this
ecosystem

## Registering a server

To register a new server, or change an existing registration, make a pull request against this
repository that adds or changes the server's entry in the appropriate server registry file (for an
affiliate's registry, work with that affiliate). A new registry is added by a pull request that adds
it to `tx-servers.json`.

Before a server is registered:

* the server software must be an [approved server](http://hl7.org/fhir/uv/tx-ecosystem/approved-servers.html):
  it passes the [test cases](http://hl7.org/fhir/uv/tx-ecosystem/testcases.html) (or an alternative set of tests
  agreed with the FHIR Product Director, for servers that only support specific code systems), and has been
  approved by the FHIR Product Director
* the endpoints must conform to the requirements in the IG, including that the coordination server can
  read `/metadata` and `/metadata?mode=terminology`

Questions: <fhir-director@hl7.org>
