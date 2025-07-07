
# ReservedUsername

Similar to reserved usernames in GitHub Enterprise Server environments (e.g., "admin", "login", "support"), this project provides a utility or logic to manage and validate reserved usernames in JavaScript applications.

## About The Project

ReservedUsername helps developers enforce restrictions on usernames by identifying and reserving a set of predefined usernames that should not be allowed for user registration or use. This is useful for platforms that want to protect system-critical or sensitive usernames from being claimed by users.

## Features

- Checks if a username is reserved
- Easily extendable list of reserved usernames
- Simple JavaScript implementation
- Includes tests to ensure correctness

## Getting Started

### Prerequisites

- Node.js (for running tests and using the module)
- npm (Node package manager)

### Installation

Clone the repository:

```
git clone https://github.com/Nikeran22/ReservedUsername.git
cd ReservedUsername
```

Install dependencies (if any):

```
npm install
```

## Usage

Import and use the module in your JavaScript code to check for reserved usernames:

```
const reservedUsername = require('./name.js');

// Example usage
const username = 'admin';
if (reservedUsername.isReserved(username)) {
  console.log(`${username} is a reserved username.`);
} else {
  console.log(`${username} is available.`);
}
```

## Running Tests

Run the test suite to verify functionality:

```
node test.js
```

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to fork the repository and submit pull requests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
