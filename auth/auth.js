const express = rqeuire('express');

module.exports = {

    isAdmin: async (req,res,next) => {
        const id = req.params.id || req.body.id;
        if(req.user.role === 'admin') {
            next();
        }
        return res.status(401).json("You are not authorized to have access in this route");
    },

    

}
    