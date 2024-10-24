const lib = require('../lib/utility')
module.exports = async (req, res, next) => {
    const { meta, paginate } = await lib.pagination(req);
    // console.log("meta", req.paginate);
    req.meta = meta;
    req.paginate = paginate;
    next();
}