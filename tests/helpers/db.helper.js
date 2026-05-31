"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectTestDB = connectTestDB;
exports.disconnectTestDB = disconnectTestDB;
exports.clearTestDB = clearTestDB;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
let mongoServer;
async function connectTestDB() {
    mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    await mongoose_1.default.connect(mongoServer.getUri());
}
async function disconnectTestDB() {
    await mongoose_1.default.disconnect();
    await mongoServer.stop();
}
async function clearTestDB() {
    const collections = mongoose_1.default.connection.collections;
    await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}
