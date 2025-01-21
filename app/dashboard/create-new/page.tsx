"use client";

import React, { useState } from 'react';
import ImageSelection from './_components/ImageSelection';
import RoomType from './_components/RoomType';
import DesignType from './_components/DesignType';
import AdditionalReq from './_components/AdditionalReq';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import { TextLoader } from './_components/CustomLoading';
import BeforeAfterSliderComponent from './_components/BeforeAfterSlider';

function CreateNew() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Store the selected file
  const [formData, setFormData] = useState({
    image: '', // Store the image URL here
    room: '',
    design: '',
    additionalRequirement: ''
  });
  const [isLoading, setIsLoading] = useState(false); // Loading state for the entire process
  const [generatedImage, setGeneratedImage] = useState<string | null>(null); // Generated image URL
  const [error, setError] = useState<string | null>(null); // Error message
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(null); // Raw image URL

  // Add an array of loading messages
  const loadingMessages = [
    "Analyzing your room...",
    "Applying design style...",
    "Generating new interior...",
    "Adding finishing touches...",
    "Almost there..."
  ];

  // Handle form input changes
  const onHandleInputChanged = (value: string, fieldName: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Handle file selection
  const handleFileSelected = (file: File) => {
    setSelectedFile(file); // Store the selected file
  };

  // Save the raw image to Supabase and return the public URL
  const saveRawImageToSupabase = async (file: File) => {
    try {
      // Generate a unique file name
      const fileName = `${Date.now()}-${file.name}`;

      // Upload the file to the `interior-images` bucket in Supabase Storage
      const { data, error } = await supabase.storage
        .from('interior-images')
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      // Get the public URL of the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('interior-images')
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image to Supabase:', error);
      throw error;
    }
  };

  // Generate the AI image using the Replicate API
  const generateAiImage = async () => {
    if (!selectedFile) {
      toast.error('Please upload an image first.');
      return;
    }

    if (!formData.room || !formData.design) {
      toast.error('Please select a room type and design style.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Save the raw image to Supabase and get the public URL
      const rawImageUrl = await saveRawImageToSupabase(selectedFile);
      setRawImageUrl(rawImageUrl);
      console.log('Raw image uploaded to Supabase. URL:', rawImageUrl);

      // Step 2: Call the `/api/redesign-room` endpoint to generate the AI image
      const result = await axios.post('/api/redesign-room', {
        imageUrl: rawImageUrl,
        roomType: formData.room,
        design: formData.design,
        additionalRequirement: formData.additionalRequirement
      });

      // Step 3: Set the generated image URL
      setGeneratedImage(result.data.result);
      toast.success('Room redesigned successfully!');
    } catch (error) {
      console.error('Error generating AI image:', error);
      setError('Failed to redesign room. Please try again.');
      toast.error('Failed to redesign room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-10 space-y-3">
        <h2 className="font-bold text-4xl text-blue-700 text-center">
          Experience the magic of AI Interior Design
        </h2>
        <p className='text-center text-gray-600 text-lg'>
          Transform any rooms with a click in seconds
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-center mt-10'> 
        {/* Image Selection */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <ImageSelection onFileSelected={handleFileSelected} />
        </div>

        {/* Form input*/}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
          {/* Room type */}
          <RoomType selectedRoomType={(value) => onHandleInputChanged(value, "room")} />

          {/* Design type */}
          <DesignType selectedDesign={(value) => onHandleInputChanged(value, "design")} />

          {/* Additional requirements textarea */}
          <AdditionalReq AdditionalReq={(value) => onHandleInputChanged(value, "additionalRequirement")} />

          {/* Button to trigger the entire process */}
          <Button 
            onClick={generateAiImage}
            disabled={isLoading || !selectedFile || !formData.room || !formData.design}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {isLoading ? 'Redesigning...' : 'Redesign Room'}
          </Button>

          {/* Add TextLoader when loading */}
          {isLoading && (
            <div className="mt-6">
              <TextLoader 
                messages={loadingMessages}
                interval={3000}
                dotCount={3}
                direction="vertical"
              />
            </div>
          )}

          {/* Display the generated image */}
          {generatedImage && rawImageUrl && !isLoading && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Before and After:</h3>
              <BeforeAfterSliderComponent 
                beforeImage={rawImageUrl} 
                afterImage={generatedImage} 
              />
            </div>
          )}

          {/* Display error message */}
          {error && (
            <p className="text-red-500 text-sm mt-4">{error}</p>
          )}

          <p className='text-sm text-gray-400 mb-52'>NOTE: 1 credit will be used to redesign your room</p>
        </div>
      </div>
    </div>
  );
}

export default CreateNew;