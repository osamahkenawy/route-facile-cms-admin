// MultiLanguageEditor.js

import React, { useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";


const CKEditorComponent = ({ language = "en", onContentChange, contentW }) => {
  const [content, setContent] = useState(contentW || "");


 // Function to replace image URLs in the content
 const replaceImageUrls = (newUrl) => {
  // Use a regular expression to find all <img> tags and replace the src attribute
  const updatedContent = content.replace(
    /<img[^>]+src="([^"]+)"/g, // This regex matches <img> tags and extracts the URL
    (match, src) => {
      // Here you can update the image URL with your new URL
      const newSrc = newUrl; // Set this to the new image URL you want to apply
      return match.replace(src, newSrc);
    }
  );
  setContent(updatedContent);
  if (onContentChange) onContentChange(updatedContent); // Notify parent component
};



  // Handle editor content change
  const handleEditorChange = (event, editor) => {
    const data = editor.getData();




    
    setContent(data);
    if (onContentChange) onContentChange(data); // Pass data to the parent component if needed
  };

  return (
    <div > 
      <CKEditor
        editor={ClassicEditor}
        data={content}
        onChange={handleEditorChange}
      
      
        config={{
          language: language, // Use the passed language prop
          
          toolbar: [
            "heading",
            "|",
            "bold",
            "italic",
            "link",
            "bulletedList",
            "numberedList",
            "blockQuote",
            "|",
            "undo",
            "redo",
            "imageUpload",
          ],
          placeholder:
            language === "en"
              ? "Start typing your content here..."
              : "ابدأ بكتابة المحتوى هنا...",
          // Adjust text direction for Arabic
          contentsLangDirection: language === "ar" ? "rtl" : "ltr",

             // Configure the image upload URL
          image: {
            toolbar: [
              "imageTextAlternative",
              "imageStyle:full",
              "imageStyle:side",
              "|",
              "linkImage",
            ],
          },
          // Add image upload handling
          simpleUpload: {
            uploadUrl: "/upload-image", // Your server URL to handle the image upload
            headers: {
              "X-CSRF-TOKEN": "CSRF-Token", // If needed, add authentication headers
            },
          },
        }}
      />
       {/* <button onClick={() => replaceImageUrls("https://variety.com/wp-content/uploads/2024/09/batman.png?w=1000&h=563&crop=1")}>
        Replace Image URL
      </button> */}
    </div>
  );
};

export default CKEditorComponent;
