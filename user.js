import { User, userSessionId } from './dbSchema.js'
import fs from 'fs';

let createUser = async (data, file) => {
    
    const existingEmail = await User.findOne({ email : data.email[0] });
    const existingPhoneNo = await User.findOne({ pnumber : data.pnumber[0] });
    const existingUsername = await User.findOne({ username : data.username[0] });

    if (existingEmail) {
        return(0);
    }
    if (existingPhoneNo) {
        return(1);
    }
    if (existingUsername) {
        return(2);
    }
    
    const dob = new Date(data.dob[0]);
    dob.setMinutes(dob.getMinutes() - dob.getTimezoneOffset());
    dob.setUTCHours(0, 0, 0, 0);
    
    let newUser = new User({
        fname : data.fname[0],
        lname : data.lname[0],
        pnumber : `${data.pcountry[0]} ${data.pnumber[0]}`,
        email : data.email[0],
        username : data.username[0], 
        password : data.password[0], 
        gender : data.gender[0], 
        registered_on : data.registered_on[0], 
        dob : dob, 
        online : data.online[0], 
        profile_pic: file
    });
    
    await newUser.save();
    return(201);
}

let loginUser = async (data) => {
    let userCredentials = JSON.parse(data);
    
    try {
        let user = await User.findOne({ username : userCredentials.username });
        if (user) {
            if (user.password === userCredentials.password) {
                return(200);
            } else {
                return(401);
            }
        } else {
            return(400);
        }
    } catch (err) {
        console.log(err);
        return(500);
    }
    
}

let getAllUsers = async data => {
    try {
        let allUsersList = await User.find({
            username: {
                $exists: true, 
                $ne: 'undefined', 
                $regex: `^${data}`
            }
        }).select('_id fname lname username profile_pic');
        
        return allUsersList;
    } catch (err) {
        console.log(err);
        return [];
    }
};

let userCreateSession = async (data) => {
    
    let session = new userSessionId({
        userId : data.user, 
        sessionId : data.id
    });
    await session.save();
    return(201);
}

let userAuthSession = async (data) => {
    const sessionOfUser = await userSessionId.find({ userId : data.user });
    if (sessionOfUser) {
        for (let i in sessionOfUser) {
            if (sessionOfUser[i].sessionId == data.id) {
                return(200);
            }
        }
        let session = new userSessionId({
            userId : data.user, 
            sessionId : data.id
        });
        await session.save();
        return(201);

    } else {
        let session = new userSessionId({
            userId : data.user, 
            sessionId : data.id
        });
        await session.save();
        return(201);
    }
}

let searchUser = async (data) => {
    try {
        let user = await User.findOne({ _id: data }).select('_id fname lname username profile_pic');
        if (!user) {
            return(404);
        } else {
            let profile;
            if (user.profile_pic) {
                profile = user.profile_pic.toString('base64');
                delete user.profile_pic;
            } else {
                let x = fs.readFileSync('./profile_pics/undefined.jpg');
                await User.updateOne(
                    { _id: user._id }, 
                    { $set: { profile_pic: x } }
                );
                profile = x.toString('base64');
            }
            return { user, profile };
        }

    } catch (err) {
        console.log(err);
        return(500);
    }
}

let searchProfile = async (data) => {
    try {
        let user = await User.findOne({ _id : data }).select('-password -friends');
        if (!user) {
            return(404);
        } else {
            let profile = user.profile_pic.toString('base64');
            delete user.profile_pic;
            return {user, profile};
        }

    } catch (err) {
        console.log(err);
        return(500);
    }
}

export { createUser, loginUser, getAllUsers, userCreateSession, userAuthSession, searchUser, searchProfile };