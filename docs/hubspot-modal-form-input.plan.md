# HubSpot Modal Form Input Validation Test Plan

## Application Overview

This test plan covers comprehensive input validation for the HubSpot modal contact form on the NUACOM website. The test focuses on correctly filling all required and optional form fields with valid data, ensuring proper form behavior without actually submitting the form to avoid server spam.

## Test Scenarios

### 1. HubSpot Modal Form Input Tests

**Seed:** `tests/nuacom.spec.ts`

#### 1.1. Input valid values into all HubSpot modal form fields

**File:** `tests/hubspot-modal/form-input.spec.ts`

**Steps:**
  1. Navigate to NUACOM homepage and wait for page to load completely
    - expect: Page loads successfully with title containing 'NUACOM'
    - expect: All overlays (cookie banners, chat widgets) are dismissed
  2. Wait for HubSpot scripts to load and initialize
    - expect: HubSpot tracking code is loaded and ready
    - expect: JavaScript handlers are properly bound to form elements
  3. Click the 'Get a Quote' button to open the HubSpot modal
    - expect: HubSpot modal opens and is visible
    - expect: Modal contains the contact form with all expected fields
    - expect: Modal has proper aria-labels and accessibility attributes
  4. Verify all required form fields are present
    - expect: Name field with asterisk (*) indicating required status
    - expect: Last name field with asterisk (*) indicating required status
    - expect: Phone number field with country selector and asterisk (*)
    - expect: Business Email field with asterisk (*) indicating required status
    - expect: Number of users needed dropdown with asterisk (*) indicating required status
    - expect: Company name field with asterisk (*) indicating required status
    - expect: Optional specific requirements text area
    - expect: Submit button is present and enabled
  5. Input valid data into the Name field
    - expect: Field accepts text input without errors
    - expect: Field validation passes for standard names
    - expect: No error messages appear
  6. Input valid data into the Last name field
    - expect: Field accepts text input without errors
    - expect: Field validation passes for standard last names
    - expect: No error messages appear
  7. Select a country code and input valid phone number
    - expect: Country dropdown opens and allows selection
    - expect: Phone number field accepts numeric input with proper formatting
    - expect: Country code is correctly applied
    - expect: Phone number validation passes
  8. Input valid business email address
    - expect: Email field accepts properly formatted email addresses
    - expect: Email validation passes for business email formats
    - expect: No error messages appear for valid emails
  9. Select number of users from dropdown
    - expect: Dropdown opens and displays user count options
    - expect: Selection can be made successfully
    - expect: Selected value is properly displayed in the field
  10. Input valid company name
    - expect: Company name field accepts text input
    - expect: Field validation passes for standard company names
    - expect: No error messages appear
  11. Input optional specific requirements in text area
    - expect: Text area accepts longer text input
    - expect: Character limits are respected if any exist
    - expect: Text formatting is preserved
  12. Verify submit button state without clicking
    - expect: Submit button becomes enabled after all required fields are filled
    - expect: Submit button maintains proper styling and accessibility
    - expect: Form validation passes for all filled fields
  13. Verify form data persistence
    - expect: All entered values remain in their respective fields
    - expect: Field focus and tab order work correctly
    - expect: No data loss occurs during form interaction
