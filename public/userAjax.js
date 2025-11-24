document.getElementById('userForm').addEventListener('submit',async function(e){
 e.preventDefault();

 const user_name = document.getElementById('user_name').value.trim();
 const passwords = document.getElementById('passwords').value.trim();
 const role_id = document.getElementById('role_id').value;

let msgBox = document.getElementById("msgBox");
    msgBox.innerHTML = "";

      if (!user_name || !passwords || !role_id) {
        showMsg("All fields are required", "danger");
        return;
    }
    if (user_name.length < 3){
        return showMsg("User name must be at least 3 characters long.", "danger");
    }
    if (passwords.length < 6) {
        return showMsg("Password must be at least 6 characters long.", "danger");
    }

    // Prepare data
    const formData = {
        user_name,
        passwords,
        role_id
    };
     try {
        let res = await fetch("/users/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });
        let data = await res.json();
    
        if (res.ok) {
            showMsg("User created successfully!", "success");
            document.getElementById("userForm").reset();
        } else {
            showMsg(data.message || "Failed to create user", "danger");
        }

    } catch (err) {
        showMsg("Server error: " + err.message, "danger");
    }
    
}) 

function showMsg(msg, type) {
    document.getElementById("msgBox").innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${msg}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}