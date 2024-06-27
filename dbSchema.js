import mongoose from 'mongoose';

const registeredUsersDB = mongoose.createConnection('', {
    dbName: 'registeredUsers'
});

const chatDB = mongoose.createConnection('', {
    dbName: 'chat'
});

const registeredUsers = new mongoose.Schema({
    fname: {
        type: String, 
        required: true
    }, 
    lname: {
        type: String, 
        required: true
    }, 
    pnumber: {
        type: String, 
        required: true
    }, 
    email: {
        type: String, 
        required: true
    }, 
    username: {
        type: String, 
        required: true
    }, 
    password: {
        type: String, 
        required: true
    }, 
    gender: {
        type: String, 
        required: true
    }, 
    dob: {
        type: Date, 
        required: true
    }, 
    registered_on: {
        type: Date, 
        required: true
    }, 
    friends: {
        type: Object, 
        default: {}
    }, 
    profile_pic: {
        type: Buffer, 
        required: true
    }
});

const sessionIds = new mongoose.Schema({
    userId : {
        type: String, 
        required: true
    }, 
    sessionId : {
        type: String, 
        required: true
    }, 
    // ttl : { 
    //     type : Date,
    //     default : Date.now 
    // }
});
// sessionIds.path('ttl').index({ expires: '60m' });

const conversations = new mongoose.Schema({
    id: {
        type: String, 
        required: true
    }, 
    participants: {
        type: Array, 
        default: [], 
        required: true
    }, 
    private: {
        type: Boolean, 
        default: true
    }
});

const messages = new mongoose.Schema({
    sender: {
        type: String, 
        required: true
    }, 
    sender_username: {
        type: String, 
        required: true
    }, 
    content: {
        type: String, 
        required: true
    }, 
    date: {
        type: Date, 
        required: true
    }, 
    conversation_id: {
        type: String, 
        required: true
    }, 
    read: {
        type: Object, 
        default: {}
    }, 
    edited: {
        type: Boolean, 
        default: false
    }, 
    deleted_for: {
        type: Array, 
        default: []
    }
});

const User = registeredUsersDB.model('User', registeredUsers);
const userSessionId = registeredUsersDB.model('userSessionId', sessionIds, 'sessionIds');
const conversation = chatDB.model('conversation', conversations, 'conversations');
const message = chatDB.model('message', messages, 'messages');

export { User, userSessionId, conversation, message };
