import React, { useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import CKEditorComponent from "../../../components/CKEditor/CKEditor";
import { Link } from "react-router-dom";


const AddPost = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTermForTags, setSearchTermForTags] = useState("");
 
  const [formData, setFormData] = useState({
    blogType: "",
    blogStatus: "",
    titleEnglish: "",
    titleArabic: "",
    descriptionEnglish: "",
    descriptionArabic: "",
    mainImage: null,
    category: "",
    thumbnailImage: null,
    tags: "",
  });
  const [previews, setPreviews] = useState({
    mainImage: null,
    thumbnailImage: null,
  });
  const allCategories = [
    "Fashion", "Woman", "Festival", "Sports", "Travel",
    "Technology", "Education", "Health", "Food", "Business",
    "Music", "Lifestyle", "Finance", "Environment", "Science"
  ];
  const allTags = [
    "Fashion", "Woman", "Festival", "Sports", "Travel",
    "Technology", "Education", "Health", "Food", "Business",
    "Music", "Lifestyle", "Finance", "Environment", "Science"
  ];

  const [filteredCategories, setFilteredCategories] = useState(allCategories?.slice(0, 10))
  const [filteredTags, setFilteredTags] = useState(allTags?.slice(0, 10))

  const [validated, setValidated] = useState(false);
   const [editorErrors, setEditorErrors] = useState({
    descriptionEnglish: "",
    descriptionArabic: ""
  });


  // Common handleChange function for inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
   
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    if (name === 'category') {
      setSearchTerm(value);
      filterCategories(value);
    } else if 
     (name === 'tags') {
      setSearchTermForTags(value);
      filterTags(value);
    } 
  };

  const filterCategories = (searchTerm) => {
    const filtered = allCategories?.filter((category) =>
      category?.toLowerCase()?.includes(searchTerm?.toLowerCase())
    );
    setFilteredCategories(filtered?.slice(0, 10));
  };
  const filterTags = (searchTerm) => {
    const filtered = allTags?.filter((tag) =>
      tag?.toLowerCase()?.includes(searchTerm?.toLowerCase())
    );
    setFilteredTags(filtered?.slice(0, 10));
  };

  // Special handler for file inputs
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      setFormData((prevData) => ({
        ...prevData,
        [name]: file,
      }));

      // Create a preview URL for the uploaded image
      setPreviews((prevPreviews) => ({
        ...prevPreviews,
        [name]: URL?.createObjectURL(file),
      }));
    }
  };

  // Handle CKEditor changes
  const handleEditorChange = (name, content) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: content,
    }));

     // Clear validation error when user starts typing
     if (content) {
      setEditorErrors((prevErrors) => ({
        ...prevErrors,
        [name]: ""
      }));
    }
  };
  

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    let valid = true;
    let newEditorErrors = { descriptionEnglish: "", descriptionArabic: "" };

    // Check if CKEditor fields are empty
    if (!formData.descriptionEnglish) {
      newEditorErrors.descriptionEnglish = "Please enter the description in English.";
      valid = false;
    }
    if (!formData.descriptionArabic) {
      newEditorErrors.descriptionArabic = "Please enter the description in Arabic.";
      valid = false;
    }

    setEditorErrors(newEditorErrors);


    if (form.checkValidity() === false || !valid) {
      e.stopPropagation();
    } else {
      // Handle form submission
      console.log("Form Data:", formData);
    }
    setValidated(true);
  };

  return (
    <Container className="container">

      <div className="post_header">
      <Link to="/blog/post">
            <Button className="btn-def">
               Post List
            </Button>
            </Link>

      </div>
    <Form noValidate validated={validated} onSubmit={handleSubmit} className="form">
      <Row className="mb-3">
        <Col sm={12} md={12} lg={6}>
          <Form.Group controlId="blogType">
            <Form.Label>Blog Type</Form.Label>
            <Form.Select
              name="blogType"
              value={formData.blogType}
              onChange={handleChange}
              required
            >
              <option value="">Select Blog Type</option>
              <option value="type1">Type 1</option>
              <option value="type2">Type 2</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              Please select a blog type.
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col sm={12} md={12} lg={6}>
          <Form.Group controlId="blogStatus">
            <Form.Label>Blog Status</Form.Label>
            <Form.Select
              name="blogStatus"
              value={formData.blogStatus}
              onChange={handleChange}
              required
            >
              <option value="">Select Blog Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              Please select a blog status.
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col sm={12} md={12} lg={6}>
          <Form.Group controlId="titleEnglish">
            <Form.Label>Title (English)</Form.Label>
            <Form.Control
              type="text"
              name="titleEnglish"
              placeholder="Enter title in English"
              value={formData.titleEnglish}
              onChange={handleChange}
              required
            />
            <Form.Control.Feedback type="invalid">
              Please enter the title in English.
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col sm={12} md={12} lg={6}>
          <Form.Group controlId="titleArabic">
            <Form.Label>Title (Arabic)</Form.Label>
            <Form.Control
              type="text"
              name="titleArabic"
              placeholder="Enter title in Arabic"
              value={formData.titleArabic}
              onChange={handleChange}
              required
            />
            <Form.Control.Feedback type="invalid">
              Please enter the title in Arabic.
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <Form.Group controlId="descriptionEnglish">
            <Form.Label>Description (English)</Form.Label>
            <CKEditorComponent
              language="en"
              onContentChange={(content) =>
                handleEditorChange("descriptionEnglish", content)
              }
            />
              {editorErrors.descriptionEnglish && (
                <div className="invalid-feedback d-block">
                  {editorErrors.descriptionEnglish}
                </div>
              )}
          </Form.Group>
        </Col>
        <Col>
          <Form.Group controlId="descriptionArabic">
            <Form.Label>Description (Arabic)</Form.Label>
            <CKEditorComponent
              language="ar"
            
              onContentChange={(content) =>
                handleEditorChange("descriptionArabic", content)
                
              }
            />
             {editorErrors.descriptionArabic && (
                <div className="invalid-feedback d-block">
                  {editorErrors.descriptionArabic}
                </div>
              )}
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col sm={12} md={12} lg={6}>
          <Form.Group controlId="mainImage">
            <Form.Label>Main Image</Form.Label>
            <Form.Control
              type="file"
              name="mainImage"
              onChange={handleFileChange}
              required
            />
            <Form.Control.Feedback type="invalid">
              Please upload the main image.
            </Form.Control.Feedback>
            {previews.mainImage && (
              <div className="mt-2">
                <img
                  src={previews?.mainImage}
                  alt="Main preview"
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
                />
              </div>
            )}
          </Form.Group>
        </Col>
        <Col sm={12} md={12} lg={6}>
          <Form.Group controlId="thumbnailImage">
            <Form.Label>Thumbnail Image</Form.Label>
            <Form.Control
              type="file"
              name="thumbnailImage"
              onChange={handleFileChange}
              required
            />
            <Form.Control.Feedback type="invalid">
              Please upload a thumbnail image.
            </Form.Control.Feedback>
            {previews.thumbnailImage && (
              <div className="mt-2">
                <img
                  src={previews?.thumbnailImage}
                  alt="Thumbnail preview"
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
                />
              </div>
            )}
          </Form.Group>
        </Col>
        {/* <Col>
          <Form.Group controlId="category">
            <Form.Label>Select Category</Form.Label>
            <Form.Control
              type="text"
              name="category"
              placeholder="Enter category"
              value={formData.category}
              onChange={handleChange}
              required
            />
            <Form.Control.Feedback type="invalid">
              Please enter a category.
            </Form.Control.Feedback>
          </Form.Group>
        </Col> */}
       
      </Row>

      <Row className="mb-3">
     
         <Col sm={12} md={12} lg={6}>
        <Form.Group controlId="category">
          <Form.Label>Select Category</Form.Label>
          <Form.Control
            type="text"
            name="category"
            placeholder="Enter category"
            value={formData.category}
            onChange={handleChange}
            // required
          />
          {/* <Form.Control.Feedback type="invalid">
            Please enter a category.
          </Form.Control.Feedback> */}
        </Form.Group>
        
        {/* Checkbox List */}
        <div className="mt-3">
          {filteredCategories?.length > 0 ? (
            filteredCategories?.map((category, index) => (
              <Form.Check
                key={index}
                type="checkbox"
                label={category}
                name="categoryOptions"
                id={`category-${index}`}
                onChange={() => console.log(`Category selected: ${category}`)}
              />
            ))
          ) : (
            <p>No categories found</p>
          )}
        </div>
      </Col>
        <Col sm={12} md={12} lg={6}>
          <Form.Group controlId="tags">
            <Form.Label>Select Tags</Form.Label>
            <Form.Control
              type="text"
              name="tags"
              placeholder="Enter tags"
              value={formData.tags}
              onChange={handleChange}
              // required
            />
            <Form.Control.Feedback type="invalid">
              Please enter tags.
            </Form.Control.Feedback>
          </Form.Group>
          <div className="mt-3">
          {filteredTags?.length > 0 ? (
            filteredTags?.map((category, index) => (
              <Form.Check
                key={index}
                type="checkbox"
                label={category}
                name="categoryOptions"
                id={`category-${index}`}
                onChange={() => console.log(`Category selected: ${category}`)}
              />
            ))
          ) : (
            <p>No tags found</p>
          )}
        </div>
        </Col>
      </Row>

      <Button type="submit" className="mt-3">
        Submit
      </Button>
    </Form>
  </Container>
  );
};

export default AddPost;
