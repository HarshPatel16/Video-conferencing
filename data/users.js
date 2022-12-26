const { ObjectId } = require("mongodb");
const mongoCollections = require("../config/mongoCollections");
const userCollection = mongoCollections.user;
const bcrypt = require("bcryptjs");
const saltRound = 14;
module.exports = {
    async createUser(username, password, email, fName, lName, userType, phonenumber, dob) {
        try {
            checkCreateUser(username, password);
            username = username.trim();
            username = username.toLowerCase();
            password = password.trim();
            phonenumber = phonenumber.trim();
            email = email.trim();

            const usercol = await userCollection();
            const chckForUser = await usercol.findOne({ username: username });
            const checkphone = await usercol.findOne({ phonenumber: phonenumber });
            const checkemail = await usercol.findOne({ email: email });
            if (chckForUser) {
                throw [400, `User Already Exists`];
            }
            if (checkphone) {
                throw [400, `Another Account exists with same phone number`];
            }
            if (checkemail) {
                throw [400, `Another Account exists with same Email Address`];
            } else {
                let haspass = await bcrypt.hash(password, saltRound);
                const newUser = {
                    username: username,
                    password: haspass,
                    email: email,
                    firstName: fName,
                    lastName: lName,
                    phonenumber: phonenumber,
                    role: userType,
                    isPublic: false,
                    dob: dob,
                    meetings: []
                };
                const addUser = await usercol.insertOne(newUser);
                if (addUser) {
                    const newId = addUser.insertedId.toString();
                    const newUserr = await this.get(newId);
                    return { userInserted: true };
                } else {
                    throw [400, "Couldn't add username"];
                }
            }
        } catch (e) {
            throw e;
        }
    },

    async addMeeting(username) {
        try {
            const usercol = await userCollection();
            const chckForUser = await usercol.findOne({ username: username });

            const updatedInfo = await usercol.updateOne({ _id: ObjectId(chckForUser._id) }, { $addToSet: { meetings: new Date().toLocaleString() } });

            const upUserr = await this.getUser(username);

            if (updatedInfo.modifiedCount === 0) {
                throw "could not update user successfully";
            }
            return true;
        } catch (e) {
            throw e;
        }
    },

    async editUser(username, fName, lName, dob, isPublic, imagePath = null) {
        try {
            var count = 0;
            const usercol = await userCollection();
            const chckForUser = await usercol.findOne({ username: username });
            if (!fName) {
                fName = chckForUser.fName;
            }
            if (!lName) {
                lName = chckForUser.lName;
            }
            if (!dob) {
                dob = chckForUser.dob;
            }

            if (chckForUser.fName !== fName) {
                count += 1;
                var updatedInfo = await usercol.updateOne({ _id: ObjectId(chckForUser._id) }, { $set: { firstName: fName } });
            }

            if (chckForUser.lName !== lName) {
                count += 1;
                var updatedInfo = await usercol.updateOne({ _id: ObjectId(chckForUser._id) }, { $set: { lastName: lName } });
            }

            if (chckForUser.dob !== dob) {
                count += 1;
                var updatedInfo = await usercol.updateOne({ _id: ObjectId(chckForUser._id) }, { $set: { dob: dob } });
            }

            if (chckForUser.isPublic !== isPublic) {
                count += 1;
                var updatedInfo = await usercol.updateOne({ _id: ObjectId(chckForUser._id) }, { $set: { isPublic: isPublic } });
            }

            if (chckForUser.imagePath !== imagePath) {
                count += 1;
                var updatedInfo = await usercol.updateOne({ _id: ObjectId(chckForUser._id) }, { $set: { profilePic: imagePath } });
            }

            if (count > 0) {
                return true;
            } else {
                return false;
            }
            return updatedInfo;
        } catch (e) {
            console.log("err:", e);
            throw e;
        }
    },

    async checkUser(username, password) {
        try {
            checkCreateUser(username, password);
            username = username.trim();
            username = username.toLowerCase();
            password = password.trim();
            const usercol = await userCollection();
            const chckForUser = await usercol.findOne({ username: username });
            if (chckForUser) {
                chckPassword = await bcrypt.compare(password, chckForUser.password);
                if (chckPassword) {
                    return { authenticated: true, userType: chckForUser.role };
                } else {
                    throw [400, `Either the username or password is invalid`];
                }
            } else {
                throw [400, `Either the username or password is invalid".`];
            }
        } catch (e) {
            throw e;
        }
    },

    async getMeetParticipants(usernameArr) {

        const userArr = [];

        for (let i = 0; i < usernameArr.length; i++) {

            const user = await this.getUser(usernameArr[i]);

            userArr.push(user);

        }

        return userArr;

    },

    async getUser(username) {
        try {
            const usercol = await userCollection();
            const chckForUser = await usercol.findOne({ username: username });
            if (chckForUser) {
                return chckForUser;
            } else {
                throw [400, `Either the username or password is invalid".`];
            }
        } catch (e) {
            throw e;
        }
    },

    async get(id) {
        if (!id) throw "You must provide an id to search for";
        if (typeof id !== "string") throw "Id must be a string";
        if (id.trim().length === 0) throw "Id cannot be an empty string or just spaces";
        id = id.trim();
        if (!ObjectId.isValid(id)) throw "invalid object ID";
        const usercol = await userCollection();
        const user = await usercol.findOne({ _id: ObjectId(id) });
        if (user === null) throw "No band with that id";
        user._id = user._id.toString();
        return JSON.stringify(user);
    },
};
const checkCreateUser = function checkCreateUser(user, pass) {
    if (!user) throw [400, `Please provide a username`];
    if (!pass) throw [400, `Please provide a passowrd`];
    if (typeof user !== "string") throw [400, `Please pass only characters in an Username`];
    if (!user.replace(/\s/g, "").length) throw [400, `Please don't pass only white spaces`];
    if (!/^[a-zA-Z]+$/.test(user)) throw [400, `Please input only charaters in an Username`];
    if (user.length < 4) throw [400, `Please enter a valid username(atleast 4 characters long)`];
    if (typeof pass !== "string") throw [400, `Please pass only characters in an password`];
    if (!pass.replace(/\s/g, "").length) throw [400, `Please don't pass white spaces in password`];
    if (/\s/.test(pass)) throw [400, `Please input only charaters in an Password`];
    if (pass.length < 6) throw [400, `Please enter a valid password(atleast 4 characters long)`];
};
