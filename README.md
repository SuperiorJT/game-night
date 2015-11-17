# game-night
A small server to manage and track player stats using a lobby system.

# Getting Started

## What You Need

- npm - This will allow you to install the required packages.
- Redis database. make sure it is running on the default port.

## How to get started

1. npm install
2. Start the Redis database
3. node main.js

That should be all! From there you can register users, but in order to start sessions or create lobbies you need to have an Admin user.
There is currently no frontend approach to this, so we have to change a key in the Redis database for this to work.

`HSET user:(Your user id here) admin true`

For now the security on this app is not very tight so I highly suggest to tell all players to **NOT use sensitive passwords**.
Although they are hashed, the backend does not handle authentication very well. I plan on fixing this in the beta version with
the switch to MySQL.
