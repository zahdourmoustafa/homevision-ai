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
import { MdPhotoLibrary } from 'react-icons/md';
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface GeneratedResult {
  generatedImage: string;
  rawImage: string;
  timestamp: number;
}

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
  const [showSlider, setShowSlider] = useState(false); // Add this state
  const { user } = useUser();
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([]);
  const [activeSlider, setActiveSlider] = useState<GeneratedResult | null>(null);

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

    if (!user?.emailAddresses?.[0]?.emailAddress) {
      toast.error('User email not found. Please ensure you are logged in.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const rawImageUrl = await saveRawImageToSupabase(selectedFile);
      setRawImageUrl(rawImageUrl);

      const result = await axios.post('/api/redesign-room', {
        imageUrl: rawImageUrl,
        roomType: formData.room,
        design: formData.design,
        additionalRequirement: formData.additionalRequirement,
        userEmail: user.emailAddresses[0].emailAddress
      });

      // Add new result to the array
      const newResult = {
        generatedImage: result.data.result,
        rawImage: rawImageUrl,
        timestamp: Date.now()
      };

      setGeneratedResults(prev => [...prev.slice(-3), newResult]); // Keep only last 4 results
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

  // Helper function to get grid position classes
  const getGridPositionClasses = (index: number) => {
    const positions = [
      "col-start-1 row-start-1", // First image (top left)
      "col-start-2 row-start-1", // Second image (top right)
      "col-start-1 row-start-2", // Third image (bottom left)
      "col-start-2 row-start-2", // Fourth image (bottom right)
    ];
    return positions[index] || positions[0];
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Left Sidebar - Full width on mobile */}
      <div className="w-full md:w-[600px] border-b md:border-b-0 md:border-r bg-white p-3">
        <div className="space-y-4">
          {/* Room Style Title Section */}
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Room Style</h2>
            <p className="text-xs text-gray-500">
              Replace the theme of your space with 20+ curated styles
            </p>
          </div>

          {/* Image Selection */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Room Photo</label>
            <ImageSelection onFileSelected={handleFileSelected} />
          </div>

          {/* Room Type Selection */}
          <div className="space-y-1">
            <RoomType selectedRoomType={(value) => onHandleInputChanged(value, "room")} />
          </div>

          {/* Design Style Selection */}
          <div className="space-y-1">
            <DesignType selectedDesign={(value) => onHandleInputChanged(value, "design")} />
          </div>

          {/* Additional Requirements - Optional, can be removed if space is tight */}
          <div className="space-y-1">
            <AdditionalReq AdditionalReq={(value) => onHandleInputChanged(value, "additionalRequirement")} />
          </div>

          {/* Generate Button */}
          <Button 
            onClick={generateAiImage}
            disabled={isLoading || !selectedFile || !formData.room || !formData.design}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9"
          >
            {isLoading ? 'Redesigning...' : 'Redesign Room'}
          </Button>

          {/* Error Message */}
          {error && (
            <p className="text-red-500 text-xs mt-1">{error}</p>
          )}

          <p className='text-xs text-gray-400'>NOTE: 1 credit will be used to redesign your room</p>
        </div>
      </div>

      {/* Right Content Area - Modified */}
      <div className="flex-1 p-4 md:p-8 bg-gray-50">
        <div className="h-full flex items-center justify-center">
          {generatedResults.length > 0 ? (
            <>
              <div className="w-full max-w-4xl">
                <div className="grid grid-cols-2 gap-4">
                  {generatedResults.map((result, index) => (
                    <div
                      key={result.timestamp}
                      className={`${getGridPositionClasses(index)} relative cursor-pointer hover:opacity-90 transition-opacity`}
                      onClick={() => setActiveSlider(result)}
                    >
                      <div className="relative rounded-lg overflow-hidden aspect-video">
                        <img
                          src={result.generatedImage}
                          alt={`Generated room ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                          Click to compare
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dialog for Before/After Slider */}
              <Dialog 
                open={activeSlider !== null} 
                onOpenChange={() => setActiveSlider(null)}
              >
                <DialogContent className="max-w-5xl w-full p-0">
                  {activeSlider && (
                    <BeforeAfterSliderComponent
                      beforeImage={activeSlider.rawImage}
                      afterImage={activeSlider.generatedImage}
                    />
                  )}
                </DialogContent>
              </Dialog>
            </>
          ) : isLoading ? (
            <div className="w-full max-w-4xl flex flex-col items-center justify-center p-6">
              <TextLoader
                messages={loadingMessages}
                interval={3000}
                dotCount={3}
                direction="vertical"
              />
            </div>
          ) : (
            <div className="w-full max-w-4xl flex flex-col items-center justify-center p-6">
              <MdPhotoLibrary className="w-10 h-10 text-gray-500 justify-center items-center" />
              <div className="text-center">
                <h1 className="text-xl font-bold">Generated renders will appear here</h1>
                <p className="text-gray-500 text-sm mt-2">
                  Ready to bring your vision to life? Get started above to create your own custom renders.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreateNew;