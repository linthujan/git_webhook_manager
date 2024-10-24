module.exports.SMS_URL = "https://msmsenterpriseapi.mobitel.lk/EnterpriseSMSV3/esmsproxy_multilang.php";

module.exports.SMS_STATUS = {
    200: "Message received OK",
    151: "invalid session",
    152: "session is still in use for previous request",
    155: "service halted",
    156: "other network messaging disabled",
    157: "IDD messages disabled",
    159: "failed credit check",
    160: "no message found",
    161: "message exceeding 160 characters",
    162: "invalid message type found",
    164: "invalid group",
    165: "no recipients found",
    166: "recipient list exceeding allowed limit",
    167: "invalid long number",
    168: "invalid short code",
    169: "invalid alias",
    170: "black listed numbers in number list",
    171: "non - white listed numbers in number list",
}