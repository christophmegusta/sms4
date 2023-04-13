const scheduleForm = document.getElementById("scheduleForm");
const messagesTable = document.getElementById("messagesTable");

scheduleForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const phone = document.querySelector("input[name='phone']").value;
    const message = document.querySelector("textarea[name='message']").value;
    const sendAt = document.querySelector("input[name='sendAt']").value;
    const recurrence = document.querySelector("select[name='recurrence']").value;
    const messageId = scheduleForm.dataset.messageId;

    const sendAtDate = new Date(sendAt);
    const sendAtTimestamp = Math.floor(sendAtDate.getTime() / 1000);

    if (messageId) {
        await fetch("/saveScheduledMessage", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: messageId, phone, message, sendAt: sendAtTimestamp, recurrence }),
        });
    } else {
        await fetch("/schedule", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ phone, message, sendAt: sendAtTimestamp, recurrence }),
        });
    }

    delete scheduleForm.dataset.messageId;

    scheduleForm.reset();
    fetchScheduledMessages();
});

async function fetchScheduledMessages() {
    const messages = await fetch("/messages").then((response) => response.json());
    const tbody = messagesTable.querySelector("tbody");
    tbody.innerHTML = "";

    for (const message of messages) {
        const row = document.createElement("tr");
        const phoneCell = document.createElement("td");
        phoneCell.textContent = message.phone;
        row.appendChild(phoneCell);

        const messageCell = document.createElement("td");
        messageCell.textContent = message.message;
        row.appendChild(messageCell);

        const sendAtCell = document.createElement("td");
        const sendAtDate = new Date(message.send_at * 1000);
        sendAtCell.textContent = sendAtDate.toLocaleDateString() + ', ' + sendAtDate.toLocaleTimeString();
        row.appendChild(sendAtCell);

        let labelColor = "grey";
        switch(message.recurrence) {
            case "once":
                labelColor = "grey";
                break;
            case "daily":
                labelColor = "olive";
                break;
            case "weekly":
                labelColor = "teal";
                break;
            case "monthly":
                labelColor = "blue";
                break;
            case "yearly":
                labelColor = "purple";
                break;
        }
        const recurrenceCell = document.createElement("td");
        recurrenceCell.innerHTML = `<label class="ui label ${labelColor}">${message.recurrence} (${message.occurrences})</label>`;
        row.appendChild(recurrenceCell);

        const actionsCell = document.createElement("td");
        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.classList.add("ui", "button", "mini");
        editButton.onclick = () => editScheduledMessage(message);
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.classList.add("ui", "button", "mini", "negative");
        deleteButton.onclick = () => deleteScheduledMessage(message.id);
        actionsCell.appendChild(deleteButton);

        row.appendChild(actionsCell);

        tbody.appendChild(row);
    }

    newScheduledMessage();
}

function editScheduledMessage(message) {
    scheduleForm.querySelector("input[name='phone']").value = message.phone;
    scheduleForm.querySelector("textarea[name='message']").value = message.message;

    const sendAtDate = new Date(message.send_at * 1000);
    const timezoneOffset = sendAtDate.getTimezoneOffset() * 60 * 1000;
    const adjustedTimestamp = sendAtDate.getTime() - timezoneOffset;

    scheduleForm.querySelector("input[name='sendAt']").valueAsNumber = adjustedTimestamp;
    scheduleForm.querySelector("select[name='recurrence']").value = message.recurrence;
    
    // Save the ID of the message being edited
    scheduleForm.dataset.messageId = message.id;
}

function newScheduledMessage() {
    scheduleForm.querySelector("input[name='phone']").value = "";
    scheduleForm.querySelector("textarea[name='message']").value = "";

    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60 * 1000; // Offset in milliseconds
    const localNow = new Date(now.getTime() - timezoneOffset);
    const formattedDate = localNow.toISOString().slice(0, 16);
    scheduleForm.querySelector("input[name='sendAt']").value = formattedDate;
}


async function deleteScheduledMessage(id) {
    await fetch("/deleteScheduledMessage", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
    });

    fetchScheduledMessages();
}

fetchScheduledMessages();
