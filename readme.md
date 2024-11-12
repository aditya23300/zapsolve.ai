about::::::::::
the product name is zapsolve.ai
motto is: Go lightspeed.

services::::::::::::

1. o-auth
2. open-ai vision models api
3. user db on firebase firestore and firebase storage for account info , payment records, etc.-----> user firebase admin sdk
4. razorpay api integration for payment
5. auth using firebase and authmiddleware on each protected route.
6. performed auth using firebase in the frontend itself, but no other service will be allowed for client sdk , only admin sdk will be used with a separate config file in the backend to access db,etc.
   So, turn off access of client to db,storage,auth from the security rules.

7. designed with phone screen on focus.
   ---->
   update:
   each user has 4 credentials:
   username
   email
   photourl
   uid
   now, the email,uid are permanent and cant change for an accout but the username,photourl can be changed by the user from his google account.
   so only use email for performing any action or identifying any specific user its like a primary key amidst the chaos of data inconsistency happening constantly.
