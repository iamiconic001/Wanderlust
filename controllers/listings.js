const Listing=require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken= process.env.MAP_Token;
const geocodingClient = mbxGeocoding({accessToken: mapToken});



module.exports.index= async(req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};


module.exports.renderNewForm= (req,res)=>{
    res.render("listings/new.ejs");
};


module.exports.showListing = async (req,res)=>{
    let {id} = req.params;
    const listing= await Listing.findById(id).populate({path :"reviews" , populate :{path : "author" ,},}).populate("owner");
    if(!listing){
        req.flash("error" , "Listing you have searched for does not exist !");
        res.redirect("/listings");
    }
    res.render("listings/show.ejs" , {listing});
};



module.exports.createListing = async(req,res)=>{


    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 2
      })
        .send();

        // console.log(response.body.features[0].geometry);
        // res.send("Done !");
        
   
let url=req.file.path;
let filename=req.file.filename;


    req.body.listing.image={
            url: req.body.listing.image,
            filename: "listingimage"
        }
       
        const newListing= new Listing(req.body.listing);
        newListing.owner=req.user._id;
        newListing.image = {url , filename};

        newListing.geometry = response.body.features[0].geometry;

        await newListing.save();
        req.flash("success" , "New Listing Created !");
        res.redirect("/listings");
    
    };




module.exports.renderEditform = async(req,res)=>{
    let {id} = req.params;
    const listing= await Listing.findById(id);
    if(!listing){
        req.flash("error" , "Listing you have searched for edit does not exist !");
        res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload" , "/upload/w_250");
    res.render("listings/edit" , {listing , originalImageUrl});
};




module.exports.updateListing = async(req,res)=>{
    let {id} = req.params;

    let listing =  await Listing.findByIdAndUpdate(id , {...req.body.listing});

    if(typeof req.file!=="undefined"){
        let url =req.file.path;
        let filename = req.file.filename;
        listing.image = {url , filename};
        await listing.save();
    }

    req.flash("success" , " Listing Updated Successfuly !")

    res.redirect(`/listings/${id}`);
};




module.exports.destroyListing = async(req,res)=>{
    let {id} = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success" , "Listing Deleted Successfuly !");
    res.redirect("/listings");
}