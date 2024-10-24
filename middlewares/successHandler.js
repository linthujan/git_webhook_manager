module.exports = (req, res, next) => {
    res.sendRes = (data, meta) => {
        const length = data && Array.isArray(data) && data.length || undefined;
        res.status(meta.status || 200).send({
            status: true,
            length,
            meta,
            data,
        });
    }
    next();
}