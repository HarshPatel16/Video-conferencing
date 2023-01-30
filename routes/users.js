const express = require("express");
const multer = require("multer");
const path = require("path");
const { user } = require("../config/mongoCollections");
const router = express.Router();
const usersData = require("../data/users");
const meetData = require("../data/meeting");
const { v4: uuidv4 } = require("uuid");
const xss = require("xss");
const { Session } = require("inspector");
const session = require("express-session");
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads");
    },
    filename: (req, file, cb) => {
        console.log("file:", file);
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

router.get("/", async (req, res) => {
    res.render("sub_layout/intro");
});

router.get("/signup", async (req, res) => {
    res.render("sub_layout/signup", { title: "Signup", hasErrors: false });
});

router.get("/login", async (req, res) => {
    if (req.session.user) {
        return res.redirect("/home");
    } else {
        res.render("sub_layout/login", { title: "Login", hasErrors: false });
    }
});

router.get("/home", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    } else {
        if (req.session.user.UserType == "Tutor") {
            res.status(200).render("sub_layout/home", {
                username: req.session.user.Username,
                tutor: req.session.user.UserType,
            });
        } else if (req.session.user.UserType == "Student") {
            res.status(200).render("sub_layout/home", {
                username: req.session.user.Username,
                student: req.session.user.UserType,
            });
        }
    }
});

router.get("/logout", async (req, res) => {
    if(req.session.user){
        user_logout = req.session.user.Username.toLowerCase();
        req.session.destroy();
    }
    return res.redirect("/");
});

router.post("/signup", async (req, res) => {
    try {
        let username = xss(req.body.username);
        let passwordSign = xss(req.body.password);
        let email = xss(req.body.email);
        let fName = xss(req.body.fName);
        let lName = xss(req.body.lName);
        let userType = xss(req.body.Type);
        let phonenumber = xss(req.body.phonenumber);
        let dob = xss(req.body.dob);

        checkCreateUser(username, passwordSign);
        const adduser = await usersData.createUser(username, passwordSign, email, fName, lName, userType, phonenumber, dob);
        if (adduser.userInserted) {
            req.session.user = {
                Username: username,
                UserType: userType,
            };
            res.redirect("/home");return
        } else {
            res.status(400).render("sub_layout/signup"),
                {
                    hasErrors: true,
                    error: "Error Occured",
                    title: "Signup",
                };
        }
        return;
    } catch (e) {
        res.status(e[0]).render("sub_layout/signup", {
            hasErrors: true,
            error: e[1],
            title: "Signup",
        });
        return;
    }
});

router.post("/login", async (req, res) => {
    try {
        let username = xss(req.body.username);
        let password = xss(req.body.password);
        checkCreateUser(username, password);
        const userCheck = await usersData.checkUser(username, password);

        if (userCheck.authenticated) {
            req.session.user = {
                Username: username,
                UserType: xss(userCheck.userType),
            };
            res.redirect("/home");
            return;
        } else {
            res.status(400).render("sub_layout/login", {
                hasErrors: true,
                title: "Login",
                error: "Either the username or password is invalid",
            });
            return;
        }
    } catch (e) {
        if (Array.isArray(e)) {
            res.status(e[0]).render("sub_layout/login", {
                hasErrors: true,
                error: `${e[1]}`,
                title: "Login",
            });
        } else {
            res.status(500).render("sub_layout/login", {
                hasErrors: true,
                error: "Internal Server Error",
                title: "Login",
            });
            return;
        }
    }
});

router.get("/meeting", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    } else {
        meetId = uuidv4();
        meetPass = meetData.makeid();
        const addmeet = await meetData.createmeet(meetId, meetPass);
        if (addmeet.meetCreated) {
            res.redirect(`/meeting/${meetId}/${meetPass}`);
        } else {
            res.status(400).render("sub_layout/home", {
                hasErrors: true,
                title: "Error",
                error: "unable to create a meet",
            });
            return;
        }
    }
});


router.post("/join", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/");
    } else {
        try {
            meetId = xss(req.body.room);
            meetPass = xss(req.body.pass);
            const chckMeet = await meetData.checkMeet(meetId, meetPass);

            if (chckMeet.authenticated) {
                res.redirect(`/meeting/${meetId}/${meetPass}`);
            } else {
                res.status(400).render("sub_layout/home", {
                    hasErrors: true,
                    title: "Error",
                    error: "unable to join a meet",
                });
                return;
            }
        } catch (e) {
            res.status(400).render("sub_layout/home", {
                hasErrors: true,
                title: "Error",
                error: "unable to join a meet",
            });
        }
    }
});

router.get("/meeting/:room/:pass", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    } else {
        try {
            meetId_ = xss(req.params.room);
            meetPass = xss(req.params.pass);
            const chckMeet = await meetData.checkMeet(meetId, meetPass);
            const addMeetuser = await usersData.addMeeting(req.session.user.Username);
            if (chckMeet.authenticated) {
                const addUserToMeet = await meetData.updateMeet(meetId, req.session.user.Username);

                req.session.user.meetId = meetId;

                console.log(req.session.user.meetId);

                res.status(200).render("sub_layout/room", {
                    roomId: req.params.room,
                    username: req.session.user.Username,
                });
            } else {
                res.status(400).render("sub_layout/home", {
                    hasErrors: true,
                    title: "Error",
                    error: "unable to join a meet",
                });
                return;
            }
        } catch (e) {
            res.status(400).render("sub_layout/home", {
                hasErrors: true,
                title: "Error",
                error: "unable to join a meet",
            });
        }
    }
});

router.get("/profile", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    } else {
        try {
            const getUser = await usersData.getUser(req.session.user.Username);
            res.render("sub_layout/profile", {
                username: getUser.username,
                email: getUser.email,
                firstName: getUser.firstName,
                lastName: getUser.lastName,
                phonenumber: getUser.phonenumber,
                dob: getUser.dob,
                meetingList: getUser.meetings,
                profilePic: getUser.profilePic,
            });
        } catch (e) {
            console.log("err route prof:", e);
        }
    }
});

router.get("/editprofile", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    } else {
        try {
            const getUser = await usersData.getUser(req.session.user.Username);
            res.render("sub_layout/editprofile", {
                firstName: getUser.firstName,
                lastName: getUser.lastName,
                dob: getUser.dob,
            });
        } catch (e) {
            res.status(e[0]).render("sub_layout/editprofile", {
            hasErrors: true,
            error: e[1]
        });
        return;}
    }
});

router.post("/editprofile", upload.single("profilePic"), async (req, res) => {
    console.log("file route:", req.file);
    try {
        let fname1 = xss(req.body.firstName);
        let lname1 = xss(req.body.lastName);
        let dob = xss(req.body.dob);
        let isPublic = xss(req.body.isPublic);
        let imagePath = req.file ? "public/uploads/" + req.file.filename : null;

        const edituser = await usersData.editUser(xss(req.session.user.Username), fname1, lname1, dob, isPublic, imagePath);

        if (edituser) {
            return res.redirect("/profile");
        } else {
            return (
                res.status(400).render("sub_layout/editprofile"),
                {
                    hasErrors: true,
                    error: "Error Occured",
                }
            );
        }
    } catch (e) {
        console.log("err route:", e);
        res.status(e[0]).render("sub_layout/editprofile", {
            hasErrors: true,
            error: e[1],
        });
        return;
    }
});

router.get("/showParticipants", async (req, res) => {
    console.log("======================");
    if (!req.session.user) {
        console.log("////////////////////////");
        return res.redirect("/home");
    } else {
        try {
            console.log("-------------------------");
            console.log(req.session.user.meetId);
            const meetObj = await meetData.getMeet(req.session.user.meetId);

            console.log(meetObj);
            console.log(meetObj.participants);

            if (meetObj.participants.length > 0) {
                const usersList = await usersData.getMeetParticipants(meetObj.participants);
                res.render("sub_layout/showParticipants", { usersList: usersList });
            } else {
                res.render("sub_layout/showParticipants");
            }
        } catch (e) {
            res.status(400).render("sub_layout/showParticipants", {
            hasErrors: true,
            error: e[1]
        });
        return;}
    }
});

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
    if (pass.length < 6) throw [400, `Please enter a valid password(atleast 6 characters long)`];
};

module.exports = router;
