# Appwrite Schema Update for BlogMe

To support the new code snippet and auto-save functionality in BlogMe, you need to update your Appwrite collection schema to include the following fields:

## Required Collection: "notes"

Add these fields to your "notes" collection in Appwrite:

1. **codeContent**
   - Type: String
   - Size: 4000
   - Nullable: Yes
   - Required: No

2. **language** 
   - Type: String
   - Size: 20
   - Nullable: Yes
   - Required: No

3. **richTextContent**
   - Type: String
   - Size: 4000
   - Nullable: Yes
   - Required: No

4. **mixedContent**
   - Type: String
   - Size: 10000
   - Nullable: Yes
   - Required: No

## How to Update Schema

1. Go to your Appwrite Console
2. Navigate to Database > Collections
3. Select your "notes" collection
4. Go to the "Attributes" tab
5. Click "Add Attribute" and add the following:
   - Attribute: "codeContent", Type: String, Size: 4000, Required: No
   - Attribute: "language", Type: String, Size: 20, Required: No
   - Attribute: "richTextContent", Type: String, Size: 4000, Required: No
   - Attribute: "mixedContent", Type: String, Size: 10000, Required: No

## Note

After adding these attributes, you might need to:
- Rebuild your app
- Clear browser cache
- Or refresh the page to clear any cached schema information

## Required Existing Fields (should already be present)

- title: String, size 256, required
- content: String, size 4000, required
- status: String, size 20, required (draft/published)
- category: String, size 128, nullable
- tags: String, size 256, nullable
- owner: String, size 36, required