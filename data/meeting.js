const { ObjectId } = require("mongodb");
const mongoCollections = require("../config/mongoCollections");
const meetCollection = mongoCollections.meet;

const bcrypt = require("bcryptjs");
const saltRound = 14;
const makeid = function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 8; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
};
module.exports = {
    makeid,
    async createmeet(meetId, meetPass) {
        try {
            const meetcol = await meetCollection();
            let haspass = await bcrypt.hash(meetPass, saltRound);

            const newMeet = {
                meetId: meetId,
                meetPassword: haspass,
                DateStartTime: new Date().toUTCString(),
                participants: []
            };
            const addMeet = await meetcol.insertOne(newMeet);

            const newMeet2 = await this.getMeet(meetId);
            console.log(newMeet2);

            if (addMeet) {
                return { meetCreated: true };
            } else {
                throw [400, "Couldn't add Meeting"];
            }
        } catch (e) {
            throw e;
        }
    },

    async updateMeet(meetIdValue, participantUsername) {

        const meetcol = await meetCollection();
        const chckForMeet = await meetcol.findOne({ meetId: meetIdValue });

        if (chckForMeet) {

            const updatedInfo = await meetcol.updateOne(
                { _id: ObjectId(chckForMeet._id) },
                { $addToSet: { participants: participantUsername } }
            );

            if (updatedInfo.modifiedCount === 0) {
                throw 'could not update user successfully';
            }

            const upMeet = await this.getMeet(meetIdValue);
            return true;
        } else {
            throw [400, `Meet Id dosen't match`];
        }
    },

    async removeParticipantFromMeet(meetIdValue, participantUsername) {

        console.log('removeParticipantFromMeet');
        try {
            console.log(meetIdValue);
            console.log(participantUsername);
            const meetcol = await meetCollection();
            const chckForMeet = await meetcol.findOne({ meetId: meetIdValue });

            console.log(chckForMeet);
    
            if (chckForMeet) {    
                const updatedInfo = await meetcol.updateOne(
                    { _id: ObjectId(chckForMeet._id) },
                    { $pull: { participants: participantUsername } }
                );
    
                const upMeet = await this.getMeet(meetIdValue);
                
                return upMeet;
    
            } else {
                throw [400, `Meet Id dosen't match`];
            }

        } catch (e) {
            throw e;
        }
        
        

    },

    async getMeet(meetIdValue) {
        const meetcol = await meetCollection();
        const chckForMeet = await meetcol.findOne({ meetId: meetIdValue });
        return chckForMeet;
    },

    
    async checkMeet(meetIdValue, meetPass) {
        try {
            const meetcol = await meetCollection();
            const chckForMeet = await meetcol.findOne({ meetId: meetIdValue });
            if (chckForMeet) {
                chckPassword = await bcrypt.compare(meetPass, chckForMeet.meetPassword);
                if (chckPassword) {
                    return { authenticated: true };
                } else {
                    throw [400, `Meet Id & password dosen't match`];
                }
            } else {
                throw [400, `Meet Id & password dosen't match`];
            }
        } catch (e) {
            throw e;
        }
    },
};
