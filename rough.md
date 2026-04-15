# splash screen
- reduce the loading state of the splash screen
- generate a favicon logo for the app and center it in the splash screen also make sure the logo appears in the places that a logo is needed for a mobile app 
# onboarding screen 
- add realistic illustrations to each of the onboarding screens
- left align the texts in the middle of the onboarding screens 
hange the get started text in the button to "use as guest"
- add a secondary button beside the primary button with text that says "Sign Up" which leads user to the Sign UP Screen and build the signup screen with option to coninue with social sign up options 

# sign up screen
- remove the back button 
-check the headline text in the sign up screen to ( sign up to medlens 
- the headline text in the sign up screen should be center aligned
-remove the sub-text in the sign up screen
- add a modern input group (  full  name with the input field and a placeholder insde(e.g john doe) the input field),( email with the input field and a placeholder inside e.g johndoe@gmail.com) (create password with the input field and an actionable eye icon for viewing and unviewing  the password )
- use the outline variant color in the design-tokens.css for the placeholder text in the full name, email and password input fields 
- add a focus state to the input fields ( use the primary container color in the design-tokens.css)
- reduce the blackness of the label text in the input fields 
- make sure the placeholder in the input field is using the label small text style in the design-tokens.css 
- remove the placeholder in the create password input field and add a placeholder text that says "password"
- change the lock icon in the create password input field to an actionable eye icon for viewing and unviewing  the password 
- for the input fields the clicked state should have the primary container color including the stroke
- the texts in the input fields should have the onprimary container color 
- remove the background color of the focus state in the input fields when the user is typing and only the stroke should be visible 
- if a user goes into focus mode and leaves without typing any thing , display an error using the error color role saying "Field must not be empty"remove the error only when they start typing in the input field
- For the password requirements display this in real time
- Password must be at least 8 characters long
- Password must contain at least one uppercase letter
- Password must contain at least one lowercase letter
- Password must contain at least one number
- Password must contain at least one special character
- Do not display all the password requirements at once. Display them as the user types in their password and they meet each requirement, display a green check mark next to the requirement.
- Display "Enter a valid email address" the moment the users starts typing in the email field. Remove the error messages only when the extension in the email address that follows the @ symbol does ends with "@gmail.com"
- when the user has inputted all the required fields and clicks on the signup button, change the sign up text in the button to a loading spinner that spins for 3 seconds and then navigates to the home screen
- replace the current social media icons for the "Google" logo and "Apple" logo with the iconify plugins for the "Google" logo and "Apple" logo 
- display "Enter your full name" the moment the user starts typing in the full name input field and remove the error message only when the user has inputted all the full name (eg. "Jessica Obianuju Nnadi")