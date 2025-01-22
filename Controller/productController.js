const mongoose = require("mongoose");
const Product = require("../models/productModel");
const _ = require("lodash");

exports.getAllProducts = async (req, res) => {
  try {
    // console.log(Product.collection.name);

    const data = await Product.find({});
    // console.log(data);
    // const results = JSON.parse(data);

    res.status(200).json({
      status: "success",
      requestedAt: req.requestTime,
      message: "This is the list of all products",
      results: data.length,
      data: data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Something went wrong" });
  }
};

// Finding the product by its name//
exports.findProduct = async (req, res) => {
  try {
    let queryStr = { ...req.query };
    const { productName } = req.body;
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryStr[el]);

    // Converting the query string to JSON.stringify()
    let queryFields = JSON.stringify(queryStr);
    queryFields = queryFields.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    );
    // console.log(queryFields);

    // Converting the query back to JSON object.
    queryFields = JSON.parse(queryFields);

    // Sorting logic for ASCENDING and DESCENDING
    let sortBy;
    if (req.query.sort) {
      console.log(req.query.sort);
      // sortBy = JSON.stringify(req.query.sort);
      let sortedFields = req.query.sort.split(" ");
      console.log(sortedFields);
      sortedFields.map((field) => {
        // removing the - and adding it as a number for mongoDb to recognise
        //! DESCENDING
        if (field.startsWith("-")) {
          field = field.replace("-", "");
          sortBy = { [field]: -1 };
        }
        //! ASCENDING
        else {
          sortBy = { [field]: 1 };
        }
        console.log(sortBy);
      });
    }

    // Limit the number of items displayed
    let limit = req.query.limit || 10;

    // Pagination logic
    let page = req.query.page || 1;
    // Calculating the skip value to skip the items before current page
    let skip = (page - 1) * limit;

    // !! This works only with the "name" of the product!!
    // Making the query case insensitive
    // const data = await Product.find({
    //   name: new RegExp(productName, "i"),
    //   ...queryFields,
    // })
    //   .sort(sortBy)

    //   .limit(limit)
    //   .skip(skip);

    // !! QUery for the "$or" operator to fetch either the product or the category
    const query = {
      $or: [
        { name: new RegExp(productName, "i") },
        { category: new RegExp(productName, "i") },
      ],
    };
    console.trace(query);
    const data = await Product.find(query).sort(sortBy).limit(limit).skip(skip);

    if (!data.length) {
      return res.status(500).json({ message: "Product not found" });
    }

    res.status(200).json({
      status: "success",
      requestedAt: req.requestTime,
      message: `This is the list of all products with name ${productName}`,
      results: data.length,
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

// For rendering the products with the same category , useful in the frontend for rendering //
exports.findCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;
    console.log(categoryName);

    // Sorting logic for ASCENDING and DESCENDING
    let sortBy;
    if (req.query.sort) {
      console.log(req.query.sort);
      // sortBy = JSON.stringify(req.query.sort);
      let sortedFields = req.query.sort.split(" ");
      console.log(sortedFields);
      sortedFields.map((field) => {
        // removing the - and adding it as a number for mongoDb to recognise
        //! DESCENDING
        if (field.startsWith("-")) {
          field = field.replace("-", "");
          sortBy = { [field]: -1 };
        }
        //! ASCENDING
        else {
          sortBy = { [field]: 1 };
        }
        console.log(sortBy);
      });
    }

    // Limit the number of items displayed
    let limit = req.query.limit || 10;

    // Pagination logic
    let page = req.query.page || 1;
    // Calculating the skip value to skip the items before current page
    let skip = (page - 1) * limit;

    const data = await Product.find({
      category: new RegExp(categoryName, "i"),
    })
      .sort(sortBy)
      .limit(limit)
      .skip(skip);

    if (!data.length) {
      throw new Error("Category not found");
    }
    res.status(200).json({
      status: "success",
      requestedAt: req.requestTime,
      message: `This is the list of all products with category ${categoryName}`,
      results: data.length,
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

exports.addProduct = async (req, res) => {
  try {
    // console.log(req.body);
    const data = await Product.create(req.body);
    res.status(201).json({
      status: "success",
      message: "Product added successfully",
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Something went wrong" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const data = await Product.findByIdAndUpdate(productId, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      status: "success",
      message: "Product updated successfully",
      data: data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "fail",
      message: error.message || "Something Went Wrong",
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const data = await Product.findByIdAndDelete(productId);
    if (!data) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(204).json({
      status: "success",
      message: "Product deleted successfully",
      data: data,
    });
  } catch (error) {
    // console.error(error);
    res.status(500).json({ message: error.message || "Something went wrong" });
  }
};

exports.exploreCategory = async function (req, res) {
  try {
    const categories = await Product.aggregate([
      {
        $project: {
          category: 1,
          _id: 0,
        },
      },
    ]);
    // console.trace(categories);
    // const uniqueArray = categories.filter(
    //   // obj is the current object being processed.
    //   // index is the current position of the object that is being processed
    //   // arr is an reference to the "categories" array.
    //   // the findIndex matches the first occurence and returns that index value.
    //   // so the findIndex would always run from the starting element of the "categories" array.
    //   (obj, index, arr) =>
    //     arr.findIndex(
    //       (item) => JSON.stringify(item) === JSON.stringify(obj)
    //     ) === index
    // );
    // console.trace(uniqueArray);

    const uniqueArray = _.uniqWith(categories, _.isEqual);
    console.trace(uniqueArray);
    res.status(200).json({
      status: "success",
      message: "List of all categories",
      data: uniqueArray,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Something went wrong" });
  }
};

exports.getDocumentCount = async function (req, res) {
  try {
    const category = req.body.category;
    const count = await Product.countDocuments({
      category: new RegExp(category, "i"),
    });
    res.status(200).json({
      status: "success",
      data: count,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message || "Failed to get document count",
    });
  }
};
