# ig-registry

Registry of published implementation guides. 

This registry is published for human convenience at http://www.fhir.org/guides/registry

Other registries:

* http://registry.fhir.org: a registry of conformance resources, including ones contained in IGs registered here

# Editing the registry 

If you want to register a new implementation guide, or a new edition of an existing guide, edit fhir-ig-list.json and then make your changes into a pull request. Note that you must make sure that the JSON file is valid, or your changes will be rejected by the build process. Alternatively, you can email your changes to fhir-director@hl7.org

# Documentation of Registry

Each implementation guide gets an entry in the registry. Implementation guides do not need to be 
published by HL7  - any one can register a published implementation guide - just make a pull request.

Entries for each implementation guide:

* name (required) : human name for the implenentation guide
* category (required) : arbitrary category for sorting/filtering - check existing ones
* npm-name : NPM Package Name - either without a context, in which case @fhir/ is assumed, and the name is assigned by FHIR product director, or else with a context, as defined by the owner of the context
* description (required) : a human readable description of the IG contents
* authority (required) : Who is responsible for publishing the IG. All IGs published by HL7 or affiliates are "HL7"
* country (required) :ISO 2 letter code, or "UV" for international
* history : URL to see a list of all published versions of the IG
* ci-build : URL to see the CI build of the IG (just the base URL - do not include the index.html etc)
* editions : optional array containing at least 1 published edition information:
  * name : Human name for published edition
  * ig-version : the stated version of the IG itself
  * fhir-version : the version of the FHIR spec that the IG is based on
  * url : where the edition is found (just the base URL - do not include the index.html etc)

Typically, only milestone releases are published, and for a given ballot sequence, only the last of the sequence - the most recent - will be listed.
