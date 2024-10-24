const { User } = require("../models");

module.exports.createUniqueOTP = async () => {
    try {
        let isFound = false;
        let newOTP;
        do {
            let randomOtp = Math.floor(100000 + (Math.random() * 1000000)).toString();
            randomOtp = randomOtp.slice(0, 6);

            const user = await User.findOne({ where: { otp_code: randomOtp } });
            isFound = user != null;
            newOTP = randomOtp;
        } while (isFound);
        return newOTP.toString();
    } catch (error) {
        console.log(error);
    }
}