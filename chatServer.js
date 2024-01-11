import http from 'http';
import url from 'url';
import { createUser, loginUser, getAllUsers, userCreateSession, userAuthSession, searchUser, searchProfile } from './user.js';
import { servePage } from './servePages.js';
import crypto from 'crypto';
import cookie from 'cookie';
import { userSessionId, User, conversation, message } from './dbSchema.js';
import formidable from 'formidable';
import fs from 'fs';
import { Server } from 'socket.io';
import { getEnabledCategories } from 'trace_events';

let serveJSFile = (req, res) => {
	const filePath = `.${req.url}`;
	let file = servePage(filePath);

	res.writeHead(200, {'content-type': 'text/javascript'});
	res.end(file);
}

let serveHTMLFile = (req, res) => {
    const parsedUrl = url.parse(req.url, true);
	const filePath = `.${parsedUrl.pathname}.html`;
	let file = servePage(filePath);

	res.writeHead(200, {'content-type': 'text/html'});
	res.end(file);
}

let serveCSSFile = (req, res) => {
	const filePath = `.${req.url}`;
	let file = servePage(filePath);

	res.writeHead(200, {'content-type': 'text/css'});
	res.end(file);
}

const routes = {
    '/': async (req, res) => {
		let file = servePage('./chatLogin.html');

		res.writeHead(200, {'content-type': 'text/html'});
		res.end(file);
	}, 
    '/chatLogin': serveHTMLFile, 
    '/validation.js': serveJSFile,
    '/search.js': serveJSFile,
    '/friendReq.js': serveJSFile,
    '/editValidation.js': serveJSFile,
    '/loadChatContainers.js': serveJSFile,
    '/client.js': serveJSFile,
    '/messages.js': serveJSFile,
    '/group.js': serveJSFile,
	'/chatAppUI.css': serveCSSFile, 
	'/chatAppHome': serveHTMLFile, 
	'/chat': serveHTMLFile, 
	'/myProfile': serveHTMLFile, 
	'/userProfile': serveHTMLFile, 
	'/createUser': async (req, res) => {
		if (req.method == 'POST') {
			const form = formidable({ 
				maxFiles : 1, 
				uploadDir: 'D:/training/images',
				maxFileSize: 5 * 1024 * 1024
			});
			let fields, files;
	
			try {
				[fields, files] = await form.parse(req);
		
				let regStatus;

				let profilepic = fs.readFileSync(files['file'][0]['filepath']);
				regStatus = await createUser(fields, profilepic);
		
				if (regStatus === 0) {
					res.writeHead(400, { 'Content-Type': 'text/html' });
					res.end('This Email already exists. Try another one.');
				} else if (regStatus === 1) {
					res.writeHead(400, { 'Content-Type': 'text/html' });
					res.end('This Phone No. already exists. Try another one.');
				} else if (regStatus === 2) {
					res.writeHead(400, { 'Content-Type': 'text/html' });
					res.end('This Username is taken. Try another one.');
				} else {
					res.writeHead(201, { 'Content-Type': 'text/html' });
					res.end('Registered successfully.');
				}
			} catch (err) {
				console.log(err);
			}
		}
	}, 
	'/login': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});

			req.on('end', async () => {
				let loginStatus = await loginUser(data);

				if (loginStatus == 200) {
					let userLogin = JSON.parse(data);

					let user = await User.findOne({ username: userLogin.username });
					let userDocId = user._id;
					const cookies = req.headers.cookie ? req.headers.cookie.split('; ') : [];
					const yourCookie = cookies.find(cookie => cookie.startsWith('SessionId='));

					if (!yourCookie) {
						const sessionId = crypto.randomBytes(32).toString('hex');

						res.setHeader('Set-Cookie', cookie.serialize('SessionId', sessionId, {
							httpOnly: true
						}));
						let sessionCreated = await userCreateSession({ id: sessionId, user: userDocId });

						if (sessionCreated == 201) {
							let authDetails = { id: sessionId, user: userDocId };

							let authenticated = await userAuthSession(authDetails);
							if (authenticated == 200 || authenticated == 201) {
								res.writeHead(200, { 'content-type': 'text/html' });
								res.end();
							} 
							else if (authenticated == 401) {
								res.writeHead(401, { 'content-type': 'text/html' });
								res.end('Unauthorized');
							}
							else {
								res.writeHead(500, { 'content-type': 'text/html' });
								res.end('Internal server error!');
							}

						} else {
							res.writeHead(500, { 'Content-Type': 'text/html' });
							res.end('Internal server error.');
						}
					} else {
						let authDetails = { id: yourCookie, user: userDocId };

						let authenticated = await userAuthSession(authDetails);
						if (authenticated == 200) {
							res.writeHead(200, { 'content-type': 'text/html' });
							res.end();
						} 
						else if (authenticated == 401) {
							res.writeHead(401, { 'content-type': 'text/html' });
							res.end('Unauthorized');
						}
						else {
							res.writeHead(500, { 'content-type': 'text/html' });
							res.end('Internal server error!');
						}
					}
				} else if (loginStatus == 400) {
					res.writeHead(400, { 'Content-Type': 'text/html' });
					res.end('User not found.');
				} else if (loginStatus == 401) {
					res.writeHead(401, { 'Content-Type': 'text/html' });
					res.end('Invalid credentials.');
				} else {
					res.writeHead(500, { 'Content-Type': 'text/html' });
					res.end('Internal server error.!!');
				}
			});
		}
	}, 
	'/isLoggedIn': async (req, res) => {
		const cookies = req.headers.cookie ? req.headers.cookie.split('; ') : [];
        const yourCookie = cookies.find(cookie => cookie.startsWith('SessionId='));

        if (yourCookie) {
            const cookieParts = yourCookie.split('=');
            let cookieExists = await userSessionId.findOne({ sessionId: cookieParts[1] });
            if (cookieExists) {
                res.writeHead(200, {'content-type': 'text/html'});
                res.end();
            }
        }
	}, 
	'/chatappLogin': async (req, res) => {
		const cookies = req.headers.cookie ? req.headers.cookie.split('; ') : [];
        const yourCookie = cookies.find(cookie => cookie.startsWith('SessionId='));
        if (yourCookie) {
            const cookieParts = yourCookie.split('=');
            let cookieExists = await userSessionId.findOne({ sessionId: cookieParts[1] });

            if (cookieExists) {
                let details = await User.findOne({ _id: cookieExists.userId }).select('-password');
				let profile;
				if (details.profile_pic) {
					profile = details.profile_pic.toString('base64');
				} else {
					let x = fs.readFileSync('./profile_pics/undefined.jpg');
					await User.updateOne(
						{ _id: details._id }, 
						{ $set: { profile_pic: x } }
					);
					profile = x.toString('base64');
				}
                res.writeHead(200, {'content-type': 'application/json'});
                res.end(JSON.stringify({details, profile}));
            } else {
                res.writeHead(401, {'content-type': 'text/html'});
                res.end('Unauthorized.');
            }
        } else {
            res.writeHead(401, {'content-type': 'text/html'});
            res.end('Unauthorized.');
        }
	}, 
	'/logout': async (req, res) => {
		if (req.method == 'DELETE') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				res.setHeader('Set-Cookie', cookie.serialize('SessionId', '', {
					httpOnly: true,
					expires: new Date(0),
					maxAge: 0
				}));
				await userSessionId.findOneAndDelete({ userId : data });
				res.writeHead(200, {'content-type': 'text/html'});
				res.end();
			});
		}
	}, 
	'/getUsersList': async (req, res) => {
		if (req.method == 'POST') {
			try {
				let data = '';
				req.on('data', chunk => {
					data += chunk;
				});
				req.on('end', async () => {
					let users = await getAllUsers(data);

					if (users) {
						let profile = users.map(user => {
							let pic = user.profile_pic.toString('base64');
							return { user: { ...user.toObject(), profile_pic: undefined }, profile: pic };
						});

						res.writeHead(200, {'content-type': 'application/json'});
						res.end(JSON.stringify(profile));

					} else {
						res.writeHead(204);
						res.end();
					}

				});

			} catch (err) {
				console.log(err);
				res.writeHead(500);
				res.end();
			}
		}
	}, 
	'/getUserDetails': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				try {
					let userDetails = await searchUser(data);

					if (userDetails == 404) {
						res.writeHead(404, {'content-type': 'text/plain'});
						res.end('Internal server error.');
					} else {
						res.writeHead(200, {'content-type': 'application/json'});
						res.end(JSON.stringify(userDetails));
					}

				} catch (err) {
					console.log(err);
					res.writeHead(500, {'content-type': 'text/plain'});
					res.end('Internal server error.');
				}
				
			});
		}
	}, 
	'/getUserProfile': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				try {
					let userDetails = await searchProfile(data);

					if (userDetails == 404) {
						res.writeHead(404, {'content-type': 'text/plain'});
						res.end('Internal server error.');
					} else {
						res.writeHead(200, {'content-type': 'application/json'});
						res.end(JSON.stringify(userDetails));
					}

				} catch (err) {
					console.log(err);
					res.writeHead(500, {'content-type': 'text/plain'});
					res.end('Internal server error.');
				}
				
			});
		}
	}, 
	'/friendRequest': async (req, res) => {
		if (req.method == 'POST') {
			let data = ''; 
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				try {
					let friendReq = JSON.parse(data);
					await User.updateOne(
						{ _id: friendReq.to }, 
						{ $set: { [`friends.${friendReq.from}`]: false } }
					);
					res.writeHead(200);
					res.end();
				} catch (err) {
					console.log(err);
					res.writeHead(500, {'content-type': 'text/plain'});
					res.end('Internal server error.');
				}
			});
		}
	}, 
	'/reqRejected': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				let users = JSON.parse(data);
				try {
					await User.findOneAndUpdate(
						{ _id: users.p1 }, 
						{ $unset: { [`friends.${users.p2}`]: 1 } }
					);
					res.writeHead(200);
					res.end();
				} catch (err) {
					console.log(err);
					res.writeHead(500);
					res.end();
				}
			});
		}
	}, 
	'/reqAccepted': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				let users = JSON.parse(data);
				try {
					await User.findOneAndUpdate(
						{ _id: users.p1 }, 
						{ $set: { [`friends.${users.p2}`]: true } }
					);
					await User.findOneAndUpdate(
						{ _id: users.p2 }, 
						{ $set: { [`friends.${users.p1}`]: true } }
					);
					res.writeHead(200);
					res.end();
				} catch (err) {
					console.log(err);
					res.writeHead(500);
					res.end();
				}
			});
		}
	}, 
	'/removeFriend': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				let user = JSON.parse(data);
				try {
					await User.findOneAndUpdate(
						{ _id: user.from }, 
						{ $unset: { [`friends.${user.unfriend}`]: 1 } }
					);
					await User.findOneAndUpdate(
						{ _id: user.unfriend }, 
						{ $unset: { [`friends.${user.from}`]: 1 } }
					);
					res.writeHead(200);
					res.end();
				} catch (err) {
					console.log(err);
					res.writeHead(500);
					res.end();
				}
			});
		}
	}, 
	'/editUser': async (req, res) => {
		if (req.method == 'PATCH') {
			const form = formidable({});
			let fields, files;
			try {
				[fields, files] = await form.parse(req);
				let user = await User.findById(fields._id[0]);
				const newPath = `./profile_pics/${fields.username[0]}.jpg`;
		
				fs.rename(`./profile_pics/${user.username}.jpg`, newPath, (err) => {
					if (err) {
						console.log(err);
						res.writeHead(500, { 'Content-Type': 'text/plain' });
						res.end('Internal Server Error');
						return;
					}
				});
				await User.findByIdAndUpdate(
					{ _id: fields._id[0] }, 
					{ '$set': {
						fname: fields.fname[0], 
						lname: fields.lname[0], 
						username: fields.username[0], 
						pnumber: `${fields.pcountry[0]} ${fields.pnumber[0]}`, 
						email: fields.email[0], 
						gender: fields.gender[0], 
						dob: fields.dob[0], 
					} }
				);
				
				res.writeHead(200);
				res.end();
			} catch (err) {
				console.log(err);
				res.writeHead(500);
				res.end();
			}
		}
	}, 
	'/editUserPsswd': async (req, res) => {
		if (req.method == 'PATCH') {
			const form = formidable({});
			let fields, files;
			try {
				[fields, files] = await form.parse(req);
	
				let user = await User.findOne({ _id: fields._id[0] });
				if (user.password === fields.ppsswd[0]) {
					await User.findByIdAndUpdate(
						{ _id: fields._id[0] }, 
						{ '$set': {
							password: fields.npsswd[0],  
						} }
					);
					res.writeHead(200);
					res.end();
				} else {
					res.writeHead(401);
					res.end();
				}
			} catch (err) {
				console.log(err);
				res.writeHead(500);
				res.end();
			}
		}
	}, 
	'/updateProfilePic': async (req, res) => {
		if (req.method == 'PATCH') {
			const form = formidable({ 
				maxFiles : 1, 
				uploadDir: 'D:/training/images',
			});
			let fields, files;
	
			try {
				[fields, files] = await form.parse(req);

                const allowedExtensions = ['jpg', 'jpeg', 'gif', 'png'];
                const fileNameParts = files['file'][0].originalFilename.split('.');
                const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();

                if (allowedExtensions.includes(fileExtension)) {
                    let profile = fs.readFileSync(files['file'][0]['filepath']);
					await User.updateOne(
						{ _id: fields['user'][0] }, 
						{ $set: { profile_pic: profile } }
					);
                    res.writeHead(200);
                    res.end();
                } else {
                    res.writeHead(400);
                    res.end();
                }
		
			} catch (err) {
                console.log(err);
				res.writeHead(500);
				res.end();
			}
		}
	}, 
	'/getConversationID': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				try {
					let userDetails = JSON.parse(data);
					
					let conversationFound = await conversation.findOne({
						private: true, 
						participants: {
							$all: [ userDetails.p1, userDetails.p2 ], 
							$size: 2
						}
					});
		
					if (conversationFound) {
						res.writeHead(200);
						res.end(conversationFound.id);
		
					} else {
						let newConvo = new conversation({
							id: userDetails.p1 + userDetails.p2, 
							participants: [userDetails.p1, userDetails.p2],
							private: true
						});
		
						await newConvo.save();
		
						res.writeHead(201);
						res.end(newConvo.id);
					}
				} catch (err) {
					console.error(err);
					res.writeHead(500);
					res.end();
				}
	
			});
		}
	}, 
	'/getConversationHistory': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				let details = JSON.parse(data);
				let messages = await message.find({
					conversation_id: details.convo, 
					date: { $lt: details.lastdate }, 
					deleted_for: { $nin: [`${details.requestedBy}`] }
				}).sort({ 
					date: -1 
				}).limit(20);

				await message.updateMany(
					{ 
						conversation_id: details.convo,  
						deleted_for: { $nin: [`${details.requestedBy}`] }, 
						[`read.${details.requestedBy}`]: false
					}, 
					{ $set: { [`read.${details.requestedBy}`]: true } }
				)
	
				if (messages.length > 0) {
					res.writeHead(200, { 'content-type': 'applicaton/json' });
					res.end(JSON.stringify(messages));

				} else {
					res.writeHead(204);
					res.end();
				}
			});
		}
	}, 
	'/createGroup': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				let groupDetails = JSON.parse(data);
				
				try {
					
					let group = new conversation({
						id: groupDetails.title, 
						participants: groupDetails.participants, 
						private: false
					});
					await group.save();
	
					res.writeHead(201);
					res.end();
	
				} catch (err) {
					console.log(err);
					res.writeHead(500);
					res.end();
				}
			});
		}
	}, 
	'/getGroups': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				try {
					let groups = await conversation.find({
						private: false,
						participants: {
							'$elemMatch': {
								[data]: {
									'$in': ['member', 'admin']
								}
							}
						}
					});
	
					if (groups.length > 0) {
						res.writeHead(200, { 'content-type': 'application/json' });
						res.end(JSON.stringify(groups));
	
					} else {
						res.writeHead(204);
						res.end();
					}
					
				} catch (err) {
					console.log(err);
					res.writeHead(500);
					res.end();
				}
			});
		}
	}, 
	'/isInGroup': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				let group = JSON.parse(data);
				try {
					let groups = await conversation.find({
						_id: group.group, 
						participants: {
							'$elemMatch': {
								[group.user]: { $exists: true }
							}
						}
					});
	
					if (groups.length > 0) {
						res.writeHead(200);
						res.end();
	
					} else {
						res.writeHead(401);
						res.end();
					}
					
				} catch (err) {
					console.log(err);
					res.writeHead(500);
					res.end();
				}
			});
		}
	}, 
	'/getGroupConvoDetails': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				try {
					let group = await conversation.findById(data);
					res.writeHead(200, { 'content-type': 'application/json' });
					res.end(JSON.stringify(group));
		
				} catch (err) {
					console.log(err);
					res.writeHead(500);
					res.end();
				}
			});
		}
	}, 
	'/getConvoDetails': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				try {
					let convo = await conversation.findOne({ id: data });
					res.writeHead(200, { 'content-type': 'application/json' });
					res.end(JSON.stringify(convo));
		
				} catch (err) {
					console.log(err);
					res.writeHead(500);
					res.end();
				}
			});
		}
	}, 
	'/makeAdmin': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				let groupDetails = JSON.parse(data);
				try {
					let filter = { _id: groupDetails.convo }; 
					let update = {
						$set: { [`participants.$[element].${groupDetails.user}`]: 'admin' }
					};
					let options = {
						arrayFilters: [{ [`element.${groupDetails.user}`]: 'member' }]
					};

					await conversation.updateOne(filter, update, options);

					res.writeHead(200);
					res.end();

				} catch (err) {
					console.log(err);
					res.writeHead(500);
					res.end();
				}
			});
		}
	}, 
	'/removeAdmin': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				let groupDetails = JSON.parse(data);

				try {
					let filter = { _id: groupDetails.convo }; 
					let update = {
						$set: { [`participants.$[element].${groupDetails.user}`]: 'member' }
					};
					let options = {
						arrayFilters: [{ [`element.${groupDetails.user}`]: 'admin' }]
					};

					await conversation.updateOne(filter, update, options);

					res.writeHead(200);
					res.end();

				} catch (err) {
					console.log(err);
					res.writeHead(500);
					res.end();
				}
			});
		}
	}, 
	'/kickUser': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				let groupDetails = JSON.parse(data);

				try {
					await conversation.updateOne(
						{ _id: groupDetails.convo },
						{ $pull: { participants: { [groupDetails.user]: { $exists: true } } } }
					);

					res.writeHead(200);
					res.end();

				} catch (err) {
					console.log(err);
					res.writeHead(500);
					res.end();
				}
			});
		}
	}, 
	'/editGroup': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				let groupDetails = JSON.parse(data);
				
				try {
					if (groupDetails.participants) {
						await conversation.updateOne({
							_id: groupDetails.id
						}, {
							$set: { id: groupDetails.title }, 
							$push: {
								participants: {
									$each: groupDetails.participants
								}
							} 
						});
					} else {
						await conversation.updateOne({
							_id: groupDetails.id
						}, {
							$set: { id: groupDetails.title }, 
						});
					}
					
					res.writeHead(201);
					res.end();
	
				} catch (err) {
					console.log(err);
					res.writeHead(500);
					res.end();
				}
			});
		}
	}, 
	'/unreadMessages': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				let details = JSON.parse(data);
				
				let unreadMessages = await message.find({
					conversation_id: details.convo, 
					[`read.${details.user}`]: false
				}).countDocuments();
	
				if (unreadMessages > 0) {
					res.writeHead(200, { 'content-type': 'text/plain' });
					res.end(unreadMessages.toString());
	
				} else {
					res.writeHead(204);
					res.end();
				}
	
			});
		}
	}, 
	'/deleteForMe': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				let details = JSON.parse(data);
				try {
					await message.updateOne(
						{ _id: details.message }, 
						{ $push: { deleted_for: details.user } }
					);
	
					res.writeHead(200);
					res.end();
	
				} catch (err) {
					console.log(err);
					res.writeHead(500);
					res.end();
				}
			});
		}
	}, 
	'/deleteForEveryone': async (req, res) => {
		if (req.method == 'POST') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				let details = JSON.parse(data);
				try {
					await message.updateOne(
						{ _id: details.message }, 
						{ $push: { deleted_for: { $each: ['everyone'], $position: 0 } } }
					);

					res.writeHead(200);
					res.end();

				} catch (err) {
					console.log(err);
					res.writeHead(500);
					res.end();
				}
			});
		}
	}, 
	'/clearChat': async (req, res) => {
		if (req.method == 'DELETE') {
			let data = '';
			req.on('data', chunk => {
				data += chunk;
			});
			req.on('end', async () => {
				let details = JSON.parse(data);
				try {
					await message.updateMany(
						{
							conversation_id: details.convo, 
							deleted_for: { $nin: [details.user] }
						}, 
						{ $push: { deleted_for: details.user } }
					);
	
					res.writeHead(200);
					res.end();
	
				} catch (err) {
					console.log(err);
					res.writeHead(500);
					res.end();
				}
			});
		}
	}, 
    '/deleteMyAccount': async (req, res) => {
        if (req.method == 'DELETE') {
            let data = '';
            req.on('data', chunk => {
                data += chunk;
            });
            req.on('end', async () => {
                try {
                    await User.updateOne(
                        { _id: data }, 
                        { 
                            $set: { fname: 'Average', lname: 'Spark User', username: 'undefined' }, 
                            $unset: { pnumber: 1, email: 1, password: 1, gender: 1, dob: 1, registered_on: 1 }
                        }
                    );
                    res.writeHead(200);
                    res.end();

                } catch (err) {
                    console.log(err);
                    res.writeHead(500);
                    res.end();
                }

            });
        }
    }
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const routeHandler = routes[parsedUrl.pathname];

	if (routeHandler) {
		routeHandler(req, res);

	} else {
        res.writeHead(404, {'content-type': 'text/html'});
        res.end('<h3>404. Requested content not found</h3>');
    }
    
});

server.listen(3000);

const io = new Server(server);
const activity = io.of('/active');
const chat = io.of('/chat');
const friendRequest = io.of('/friendRequest');

let onlineUsers = {};
activity.on('connection', async socket => {
    
    socket.on('user connected', async data => {
        onlineUsers[socket.id] = data._id;
        activity.emit('user connected', onlineUsers);
    });

    socket.on('disconnect', () => {
        activity.emit('user disconnected', onlineUsers[socket.id]);
        delete onlineUsers[socket.id];
    });
});

let chatUsers = {};
chat.on('connection', async socket => {

    socket.on('entered chat', async data => {
        chatUsers[socket.id] = data;
    });

    socket.on('joined the conversation', async data => {
        await socket.join(data);
    });

    socket.on('chat message', async data => {
        let convoType;
        let recievers;
        let CONVO = await conversation.findOne({ id: data.convoID });
        if (!CONVO) {
            let x = await conversation.findOne({ _id: data.convoID });
            if (x) {
                convoType = 'group';
                let membersList = x.participants;
    
                recievers = membersList.map(obj => Object.keys(obj)[0]);
            }
        } else {
            convoType = 'private';
            recievers = CONVO.participants;
        } 
        recievers = recievers.slice();
        recievers.splice(recievers.indexOf(chatUsers[socket.id]), 1);
        activity.emit('message sent', { sender: chatUsers[socket.id], convo: data.convoID, type: convoType, message: data.message, recievers: recievers });
        try {
            let newMessage = new message({
                sender: data.from, 
				sender_username: data.username, 
                content: data.message, 
                date: new Date(),
                conversation_id: data.convoID,
                read: data.to
            });
    
            await newMessage.save();
            
            chat.to(data.convoID).emit('chat message', { sender: socket.id, text: data.message, date: new Date(), msgID: [newMessage._id].toString(), senderID: data.from, username: data.username });

        } catch (err) {
            console.log(err);
        }

    });

    socket.on('message seen', async data => {
        await message.updateOne(
            { _id: data.msgID }, 
            { $set: { [`read.${data.user}`]: true } }
        );
        let messageObj = await message.findById(data.msgID);
        chat.emit('message seen', { id: data.msgID, read: messageObj.read });
    });

    socket.on('message deleted', async data => {
        chat.emit('message deleted', data);
    });

    socket.on('message edit', async data => {
        try {
            await message.updateOne(
                { _id: data.msgid }, 
                { $set: { content: data.message, edited: true } }
            );
            chat.emit('message edit', data);

        } catch (err) {
            console.log(err);
        }
    });

	socket.on('typing', async data => {
		chat.emit('typing', data);
		activity.emit('typing', data);
	});

    socket.on('disconnect', () => {
        delete chatUsers[socket.id];
    });

});

friendRequest.on('connection', socket => {
	socket.on('friend request', async data => {
		activity.emit('friend request', data);
	});
});
