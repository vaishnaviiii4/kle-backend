const express=require('express');
const app=express();
const mongoose=require('mongoose');
const {User}=require('./model/User');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const cors=require('cors');
const morgan=require('morgan');
const {Product}=require('./model/Product');
const {Cart}=require('./model/Cart');


//middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/klee')
.then(()=>{
    console.log('db connected');
}).catch((err)=>{
    console.log('db is not connected',err)
})

//task-1 create a route for register user
 app.post('/register',async(req,res)=>{
     try{
         let {email,name,password} = req.body;
         if(!email || !name ||!password){
             return res.status(400).json({message:"Some fields are Missing"})
         }
         let isUserAlreadyExist = await User.findOne({email});
         if(isUserAlreadyExist){
             return res.status(400).json({message:"User already has a account"});
         }else{
             //hash the password
             const salt = bcrypt.genSaltSync(10);
             const hashedPassword = bcrypt.hashSync(password,salt);
 
             //token
             const token = jwt.sign({email},"supersecret",
                 {expiresIn:'365d'});
 
             await User.create({
                 name,
                 email,
                 password:hashedPassword,
                 token,
                 role:'user'
             })
         return res.status(201).json({message:"User created Successfully"})
         }
     }catch(error){
         console.log(error);
         res.status(500).json({message:"Inernal server Error"})
     }
 })
 
 
 //task-2 create a route for login user
 app.post('/login',async(req,res)=>{
     try{
         let {email,password} = req.body;
 
         if(!email || !password){
             return res.status(400).json({message:"Email and password are required"})
         }
         const user = await User.findOne({email});
         if(!user){
             return res.status(400).json({message:"User is not registered, Please create Account"})
         }
         //check password
         const isPasswordMatched = bcrypt.compareSync(password,user.password);
 
         if(!isPasswordMatched){
             return res.status(400).json({message:"invalid Password"})
         }
 
         //successful login
         return res.status(200).json({
             id:user._id,
             name:user.name,
             token: user.token,
             email: user.email,
             role:user.role
         })
 
 
     }catch(error){
         console.log(error);
         res.status(500).json({message:"Inernal server Error"})
     }
 })
 
 //task-3 -> create route see all the product
 app.get('/products',async(req,res)=>{
     try{
         const products = await Product.find();
         res.status(200).json({
             message:"Product found successfully",
             products:products
         })
 
     }catch(error){
         console.log(error);
         res.status(500).json({message:"Inernal server Error"})
     }
 })
 
 //task-4-> create a route to add product
 app.post('/add-product',async(req,res)=>{
     try{
 
         const {name, image, price, description,stock,brand} = req.body;
         const {token} = req.headers;
         const decodedtoken = jwt.verify(token,"supersecret");
         const user = await User.findOne({email:decodedtoken.email});
         const product = await Product.create({
             name,
             description,
             image,
             price, 
             stock,
             brand,
             user:user._id
         })
         return res.status(201).json({
             message:"Product created successfully",
             product:product
         })
 
     }catch(error){
         console.log(error);
         res.status(500).json({message:"Inernal server Error"})
     }
 })
 
 
 //task5 -> to show the particular product
 app.get('/product/:id', async(req,res)=>{
     try{
         const {id} = req.params;
         if(!id){
             res.status(400).json({message:"Product Id not found"});
         }
 
         const {token} = req.headers;
 
         const userEmailFromToken = jwt.verify(token,"supersecret");
         if(userEmailFromToken.email){
             const product = await Product.findById(id);
 
             if(!product){
                 res.status(400).json({message:"Product not found"});
             }
 
             res.status(200).json({message:"success",product});
         }
 
     }catch(error){
         console.log(error);
         res.status(500).json({message:"Internal server error"});
     }
 })
 
 //task-6 update a product
 app.patch('/product/edit/:id',async(req,res)=>{
  const {id} = req.params;
  const {token} = req.headers;
  const {name, image, price, stock, brand, description} = req.body.productData;
  const decodedtoken = jwt.verify(token, "supersecret");
  try{
     if(decodedtoken.email){
         const updatedProduct = await Product.findByIdAndUpdate(id,{
            name,
            description,
            image,
            price,
            brand,
            stock 
         })
         return res.status(200).json({
             message:"product updated successfully",
             product: updatedProduct
         })
     }
  }catch(error){
         console.log(error);
         res.status(500).json({message:"Inernal server Error"})
     }
 })
 
 //task-7 delete the product
 app.delete('/product/delete/:id',async(req,res)=>{
     const {id}  = req.params;
     if(!id){
         return res.status(400).json({message:"Product id not found"});
     }
     try{
         const deletedProduct = await Product.findByIdAndDelete(id);
 
         if(!deletedProduct){
             return res.status(404).json({message:"Product not found"})
         }
 
         return res.status(500).json({
             message:"Product deleted succcessfuly",
             product: deletedProduct
         })
 
     }catch(error){
         console.log(error);
         res.status(500).json({message:"Inernal server Error"})
     }
 })



//task->8 create reote to see all the products
app.get('/cart',async(req,res)=>{
    try{
        let{token}=req.headers
        let decodedToken=jwt.verify(token,"supersecret");
        const user=await User.findOne({email:decodedToken.email}).populate({
            path:'cart',
            populate:{
                path:'products',
                model:'Product'
            }
        })
        if(!user){
            return res.status(400).json({
                message:"User not found"
            })
        }
        return res.status(200).json({
            cart:user.cart
        })
    }catch(error){
        console.log(error);
        res.status(500).json({message:"Inernal server Error"})
    }

})
 

//task=>9 create route to add product in cart
app.post('/cart/add',async(req, res)=>{
    try {
        const body = req.body;
        // Getting product ids from frontend
        const productArray = body.products;
        let totalPrice = 0;

        // Find the product and add product price to total
        for (let item of productArray) {
            const product = await Product.findById(item);
            if (product) {
                totalPrice += product.price;
            }
        }

        let { token } = req.headers;
        let decodedToken = jwt.verify(token, "supersecret");
        const user = await User.findOne({ email: decodedToken.email });

        if (!user) {
            return res.status(400).json({
                message: 'User not found'
            });
        }

        // Checking if the user already has a cart
        let cart;
        if (user.cart) {
            cart = await Cart.findById(user.cart).populate('products');
            // Extracting product IDs from the existing cart
            const existingProductIds = cart.products.map((product) => product._id.toString());

            // Looping through the newly added products
            // If product is not already in the cart, add it
            for (let productId of productArray) {
                if (!existingProductIds.includes(productId)) {
                    cart.products.push(productId);
                    const product = await Product.findById(productId);
                    if (product) {
                        totalPrice += product.price;
                    }
                }
            }

            // Updating the cart's total price
            cart.total = totalPrice;
            await cart.save();
        } else {
            // If no cart exists, create a new one
            cart = new Cart({
                products: productArray,
                total: totalPrice
            });
            await cart.save();
            user.cart = cart._id;
            await user.save();
        }

        return res.status(200).json({
            message: "Cart updated successfully",
            cart: cart
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

//task->10 create route to delete product
app.delete("/cart/product/delete", async (req, res) => {
    const { productID } = req.body;
    const { token } = req.headers;

    try {
      const decodedToken = jwt.verify(token, "supersecret");
      const user = await User.findOne({ email: decodedToken.email }).populate(
        "cart"
      );

      if (!user) {
        return res.status(404).json({ message: "User Not Found" });
      }

      const cart = await Cart.findById(user.cart).populate("products");

      if (!cart) {
        return res.status(404).json({ message: "Cart Not Found" });
      }

      const productIndex = cart.products.findIndex(
        (product) => product._id.toString() === productID
      );

      if (productIndex === -1) {
        return res.status(404).json({ message: "Product Not Found in Cart" });
      }

      cart.products.splice(productIndex, 1);
      cart.total = cart.products.reduce(
        (total, product) => total + product.price,
        0
      );

      await cart.save();

      res.status(200).json({
        message: "Product Removed from Cart Successfully",
        cart:cart
    })
}
catch(error){
    console.log(error);
    res.status(500).json({message:"Inernal server Error"})
}
})





let PORT=8080;
app.listen(PORT,()=>{
    console.log(`server connected to port ${PORT}`)
})









