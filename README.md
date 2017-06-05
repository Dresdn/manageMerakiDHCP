# Manage Meraki Fixed IP Address Assignments

## Description

The idea of this project is to demonstrate what is possible with the Meraki APIs. Specifically, this is a sample Node Express project that allows for managing the Fixed IP MAC address assignments without having to use the dashboard. 

### Use Case

The use case for this project is to allow for a non-technical user to be able to field-replace a device by entering the replacement device's MAC address. This will ensure the device receives the same DHCP address as the prior one.

### Disclaimer

This is a "proof of concept" application that is meant to be for demonstration purposes. There is a lot of work that would need to be done to "productionalize" this application, including:
- Authentication
- Error Handling
  - There is limited error handling, but it's not comprehensive by any means.
- Form Validation
  - There is no form validation other than values being required.
  - Ideally this would be done both pre- and post- submission using (maybe) jQuery and Form Validation (see above).
- Additional Customization
  - Server Address: Defaults to 'localhost'
  - Server Port: Defaults to '3000'

### Config

```
{
  "orgID": "123456",                            // Required: Organization ID (see script below to get)
  "apiKey": "2aa54c5de7ed87acba22b98d9d929205", // Required: API Key from your User Profile in the Meraki Dashboard
  "dashboardUrl": "https://n123.meraki.com"     // Required: Your Meraki Dashboard URL
}
```
#### Get Organization ID

Use the following command to get your Organization ID. Replace the Dashboard URL and API Key first ;)

```
curl --request GET --url https://n123.meraki.com/api/v0/organizations --header 'x-cisco-meraki-api-key: 2aa54c5de7ed87acba22b98d9d929205'
```

### Installation
1. Install Node
2. Download manageMerakiDHCP to a local folder
3. Download and install all dependencies:

  ```
  cd ~/manageMerakiDHCP
  npm install
  ```
4. Modify 'config.json' (see above)
5. Start the Server:

  ```
  npm start
  ```
6. Open a browser and access:

  ```
  http://localhost:3000
  ```
7. Done!
