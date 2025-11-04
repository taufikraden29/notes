// src/services/appwrite.js
import { Client, Account, Databases, ID, Query } from "appwrite";

const client = new Client()
  .setEndpoint("https://sgp.cloud.appwrite.io/v1") // Replace with your Appwrite endpoint
  .setProject("6905db3a001821aa98ec"); // Replace with your project ID

const account = new Account(client);
const databases = new Databases(client);

export { client, account, databases, ID, Query };
