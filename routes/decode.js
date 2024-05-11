import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import axios from "axios";

const initialState = {
  products: localStorage.getItem("product")
    ? JSON.parse(localStorage.getItem("product"))
    : [],
  // quantity: 0,
  // total: 0,
  quantity: 0,
  total: 0,
};

// Create an async thunk to fetch the user data
export const fetchUser = createAsyncThunk("cart/fetchUser", async () => {
  const response = await axios.get("http://localhost:5000/api/auth"); // Replace this with your own API endpoint
  return response.data;
});



export const addProductToCart = createAsyncThunk(
  "cart/addProductToCart",
  async (product, thunkAPI) => {
        console.log("Product data:", product)
        const pro = JSON.parse(product);

    try {
      const token = localStorage.getItem("token"); // Retrieve the token from localStorage
      const parsedToken = JSON.parse(token); // Parse the string to an object
      const config = {
        headers: {
          Authorization: `Bearer ${parsedToken.token}`, // Add the token to the Authorization header
        },
      };
      const response = await axios.post(
        "http://localhost:5000/api/cart/addtocart",
        pro,
        config // Pass the config object as the third argument to axios.post
      );
      console.log("postdata:", response.data)
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  }
);


const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addProduct: (state, action) => {
      const itemIndex = state.products.findIndex(
        (item) => item._id === action.payload._id
      );
      if (itemIndex >= 0) {
        state.products[itemIndex].cartQuantity += 1;
        state.quantity += 0;
        toast.info(
          `increased ${state.products[itemIndex].title} product quantity`,
          {
            position: "top-center",
          }
        );
      } else {
        const tempProduct = { ...action.payload, cartQuantity: 1 };
        console.log(tempProduct);
        state.products.push(tempProduct);
        state.quantity += 1;
         // Use the user ID to store the cart in the database
         const userID = state.user._id;
         const res = axios.post(`/api/cart/${userID}/addtocart`, tempProduct);
         console.log(res);
        toast.success(`${action.payload.title} added to cart`, {
          position: "top-center",
        });
      }
      
      state.total += action.payload.price * action.payload.quantity;

      localStorage.setItem("product", JSON.stringify(state.products));
    },
    removeFromCart(state, action) {
      const nextCartItems = state.products.filter (
        product => product._id !== action.payload._id
      );
      state.products = nextCartItems
      localStorage.setItem("product", JSON.stringify(state.products));
      toast.error(`${action.payload.title} removed from cart`, {
        position: "top-center",
      });
      state.quantity -= 1;
    },
    decreaseCart(state, action) {
      const itemIndex = state.products.findIndex(
      product => product._id === action.payload._id)
      if(state.products[itemIndex].cartQuantity > 1){
        state.products[itemIndex].cartQuantity -= 1

        toast.info(`Decreased ${action.payload.title} cart quantity`, {
          position: "top-center",
        });
      }else if (state.products[itemIndex].cartQuantity === 1){
        const nextCartItems = state.products.filter (
          product => product._id !== action.payload._id
        );
        state.products = nextCartItems
        
        toast.error(`${action.payload.title} removed from cart`, {
          position: "top-center",
        });
      }
      localStorage.setItem("product", JSON.stringify(state.products));
    },
    getTotals(state, action) {
      let { Alltotal, Allquantity } = state.products.reduce(
        (cartTotal, cartItem) => {
          const { esp, cartQuantity  } = cartItem;
          const itemTotal = (esp * cartQuantity) - 200;

          cartTotal.Alltotal += itemTotal;
          cartTotal.Allquantity += cartQuantity;

          return cartTotal;
        },
        {
          Alltotal: 0,
          Allquantity: 0,
        }
      );
      Alltotal = parseFloat(Alltotal.toFixed(2));
      state.quantity = Allquantity;
      state.total = Alltotal;
    },   
  },
  extraReducers: (builder) => {
    builder
      .addCase(addProductToCart.fulfilled, (state, action) => {
        state.products.push(action.payload);
        state.quantity += 1;
        state.total += action.payload.price * action.payload.quantity;
  
        localStorage.setItem("product", JSON.stringify(state.products));
  
        toast.success(`${action.payload.title} added to cart`, {
          position: "top-center",
        });
      })
      .addCase(addProductToCart.rejected, (state, action) => {
        toast.error(action.error.message, {
          position: "top-center",
        });
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  }, 
});

export const { addProduct, removeFromCart, decreaseCart, getTotals} = cartSlice.actions;
export default cartSlice.reducer;
