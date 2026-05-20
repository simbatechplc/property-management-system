"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CreatePropertyInput,
  createPropertySchema,
  PropertyType,
} from "@/schemas";
import { useAddPropertyMutation } from "@/hooks/api/use-property";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import ImageUploader, { UploadedImage } from "./image-upload-form";
import { useGetSubaccountDetail } from "@/hooks/api/use-payment";
import SettingsModal from "@/components/setting-modal";
import LocationSelector from "./location-selector";
import { useAuthSession } from "@/hooks/use-auth-session";

export function CreatePropertyForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreatePropertyInput>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: {
      facilities: [],
      location: {
        continent: "Africa",
        country: "Ethiopia",
        city: "Addis Ababa",
        subcity: "",
        neighborhood: "",
        nearby: "",
        latitude: "",
        longitude: "",
      },
    },
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const createPropertyMutation = useAddPropertyMutation();

  const { role: userRole } = useAuthSession();
  const getSubAcccountQuery = useGetSubaccountDetail(userRole === "OWNER");

  const facilities = watch("facilities") || [];
  const [imageFiles, setImageFiles] = useState<UploadedImage[]>();

  const onSubmit = async (data: CreatePropertyInput) => {
    if (!imageFiles || imageFiles.length === 0) {
      return toast.error("Please add images");
    }

    try {
      await createPropertyMutation.mutateAsync({
        images: imageFiles as any,
        ...data,
      });
      reset();
      router.back();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to create property";
      toast.error(msg);
    }
  };

  const addFacility = () => {
    setValue("facilities", [...facilities, { name: "" }]);
  };

  const removeFacility = (index: number) => {
    setValue(
      "facilities",
      facilities.filter((_, i) => i !== index)
    );
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter property name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                {...register("address")}
                placeholder="Enter full address"
              />
              {errors.address && (
                <p className="text-sm text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                onValueChange={(value) =>
                  setValue("type", value as PropertyType)
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(PropertyType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">
                  {errors.type.message}
                </p>
              )}
            </div>

            {/* Furnishing status — only for APARTMENT and VILLA */}
            {(watch("type") === "APARTMENT" || watch("type") === "VILLA") && (
              <div className="space-y-2">
                <Label htmlFor="furnishingStatus">Furnishing Status</Label>
                <Select onValueChange={(value) => setValue("furnishingStatus" as any, value)}>
                  <SelectTrigger id="furnishingStatus">
                    <SelectValue placeholder="Select furnishing status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FURNISHED">Furnished</SelectItem>
                    <SelectItem value="UNFURNISHED">Unfurnished</SelectItem>
                    <SelectItem value="PARTIALLY_FURNISHED">Partially Furnished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Price per night — only for VILLA */}
            {watch("type") === "VILLA" && (
              <div className="space-y-2">
                <Label htmlFor="pricePerNight">Price Per Night (ETB) <span className="text-destructive">*</span></Label>
                <Input
                  id="pricePerNight"
                  type="number"
                  min={0}
                  {...register("pricePerNight" as any, { valueAsNumber: true })}
                  placeholder="e.g. 5000"
                />
                <p className="text-xs text-muted-foreground">Villas are booked as whole units — set the nightly price here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("about.description")}
                placeholder="Describe your property"
                rows={4}
              />
              {errors.about?.description && (
                <p className="text-sm text-destructive">
                  {errors.about.description.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="continent">Continent</Label>
                <Input
                  id="continent"
                  {...register("location.continent")}
                  placeholder="e.g., Africa"
                />
                {errors.location?.continent && (
                  <p className="text-sm text-destructive">
                    {errors.location.continent.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  {...register("location.country")}
                  placeholder="e.g., Kenya"
                />
                {errors.location?.country && (
                  <p className="text-sm text-destructive">
                    {errors.location.country.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...register("location.city")}
                  placeholder="e.g., Nairobi"
                />
                {errors.location?.city && (
                  <p className="text-sm text-destructive">
                    {errors.location.city.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcity">Subcity</Label>
                <Input
                  id="subcity"
                  {...register("location.subcity")}
                  placeholder="e.g., Westlands"
                />
                {errors.location?.subcity && (
                  <p className="text-sm text-destructive">
                    {errors.location.subcity.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nearby">Nearby Landmarks</Label>
              <Input
                id="nearby"
                {...register("location.nearby")}
                placeholder="e.g., Near City Mall"
              />
              {errors.location?.nearby && (
                <p className="text-sm text-destructive">
                  {errors.location.nearby.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card> */}

        <LocationSelector
          errors={errors}
          register={register}
          setValue={setValue}
          watch={watch}
        />
        {/* License
      <Card>
        <CardHeader>
          <CardTitle>License</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="license">License File</Label>
            <Input
              id="license"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Placeholder - you'll replace this with actual upload logic
                  setValue("license.fileUrl", URL.createObjectURL(file));
                }
              }}
            />
            {errors.license?.fileUrl && (
              <p className="text-sm text-destructive">
                {errors.license.fileUrl.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card> */}

        {/* Facilities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Facilities</CardTitle>
            <Button
              type="button"
              onClick={addFacility}
              size="sm"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Facility
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {facilities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No facilities added yet. Click "Add Facility" to get started.
              </p>
            ) : (
              facilities.map((_, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      {...register(`facilities.${index}.name`)}
                      placeholder="e.g., Free WiFi, Swimming Pool"
                    />
                    {errors.facilities?.[index]?.name && (
                      <p className="text-sm text-destructive">
                        {errors.facilities[index]?.name?.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => removeFacility(index)}
                    size="icon"
                    variant="destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register("contact.phone")}
                  placeholder="+1234567890"
                />
                {errors.contact?.phone && (
                  <p className="text-sm text-destructive">
                    {errors.contact.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("contact.email")}
                  placeholder="contact@example.com"
                />
                {errors.contact?.email && (
                  <p className="text-sm text-destructive">
                    {errors.contact.email.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Images</CardTitle>
          <Button
            type="button"
            onClick={addImage}
            size="sm"
            variant="outline"
            disabled={uploadFileMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Image
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {images.map((image) => {
            return <img key={image.url} className="w-[100px] h-[100px]" />;
          })}

          <div className="space-y-2 rounded-lg border p-4">
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
              />
            </div>
          </div>
        </CardContent>
      </Card> */}

        <ImageUploader onChange={setImageFiles} />

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={createPropertyMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createPropertyMutation.isPending}
          >
            {createPropertyMutation.isPending ? <Spinner /> : "Create Property"}
          </Button>
        </div>
      </form>

      <SettingsModal
        open={isSettingsModalOpen}
        defaultTab={"payment"}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
      />
    </>
  );
}
