// Locally storing the MD5 hash of the password (the initial password is password)
localStorage.setItem("hashedPassword", "5f4dcc3b5aa765d61d8327deb882cf99");


// Function to verify a user inputted password
async function promptAndVerifyPassword() {
    // Prompting the user to enter a password
    let userPassword = prompt("Enter the password");

    // Using hashify.net to check if the hashed input matches the stored hash
    try {
        let returnedResponse = await fetch("https://api.hashify.net/hash/md5/hex?value=" + userPassword);

        // Returning true if the hashes match
        let returnedObject = await returnedResponse.json();
        if (returnedObject.Digest == localStorage.getItem("hashedPassword")) {
            alert("Valid password!");
            return true;
        }

        // Else return false
        else {
            alert("Invalid password!");
            return false;
        }
    }

    // If there is an error, return false
    catch (error) {
        alert("Invalid input!");
        return false;
    }
}