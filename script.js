const PRICES = {
  ac: 3000,
  nonac: 2000,
  bed: 500,
  pillow: 50,
  tax: 12
};

// Hotel management constants
const TOTAL_ROOMS = 20;
const ROOM_NUMBERS = Array.from({length: TOTAL_ROOMS}, (_, i) => 101 + i); // 101-120

// Initialize hotel data
function initializeHotelData() {
  // Initialize rooms array if not exists
  if (!localStorage.getItem('rooms')) {
    const rooms = ROOM_NUMBERS.map(roomNumber => ({
      roomNumber: roomNumber,
      status: 'available',
      guestName: '',
      checkin: '',
      checkout: '',
      roomType: '',
      guests: 0,
      beds: 0,
      pillows: 0,
      payment: ''
    }));
    localStorage.setItem('rooms', JSON.stringify(rooms));
  }
  
  // Initialize daily tracking
  const today = new Date().toDateString();
  const dailyData = JSON.parse(localStorage.getItem('dailyData') || '{}');
  if (!dailyData[today]) {
    dailyData[today] = { checkIns: 0, checkOuts: 0 };
    localStorage.setItem('dailyData', JSON.stringify(dailyData));
  }
  
  updateHotelStatus();
  updateCheckoutDropdown();
}

// Get rooms data
function getRooms() {
  return JSON.parse(localStorage.getItem('rooms') || '[]');
}

// Save rooms data
function saveRooms(rooms) {
  localStorage.setItem('rooms', JSON.stringify(rooms));
}

// Update hotel status display
function updateHotelStatus() {
  const rooms = getRooms();
  const availableRooms = rooms.filter(room => room.status === 'available').length;
  const bookedRooms = rooms.filter(room => room.status === 'booked').length;
  
  const today = new Date().toDateString();
  const dailyData = JSON.parse(localStorage.getItem('dailyData') || '{}');
  const todayData = dailyData[today] || { checkIns: 0, checkOuts: 0 };
  
  document.getElementById('totalRooms').textContent = TOTAL_ROOMS;
  document.getElementById('roomsAvailable').textContent = availableRooms;
  document.getElementById('bookedRooms').textContent = bookedRooms;
  document.getElementById('checkInsToday').textContent = todayData.checkIns;
  document.getElementById('checkOutsToday').textContent = todayData.checkOuts;
  document.getElementById('todayDate').textContent = today;
}

// Update checkout dropdown with booked rooms
function updateCheckoutDropdown() {
  const rooms = getRooms();
  const bookedRooms = rooms.filter(room => room.status === 'booked');
  const dropdown = document.getElementById('checkoutRoomSelect');
  
  dropdown.innerHTML = '<option value="">Select a room to check out</option>';
  
  bookedRooms.forEach(room => {
    const option = document.createElement('option');
    option.value = room.roomNumber;
    option.textContent = `Room ${room.roomNumber} - ${room.guestName}`;
    dropdown.appendChild(option);
  });
}

// Find first available room
function findAvailableRoom() {
  const rooms = getRooms();
  return rooms.find(room => room.status === 'available');
}

// Check out a room
function checkoutRoom() {
  const selectedRoomNumber = document.getElementById('checkoutRoomSelect').value;
  
  if (!selectedRoomNumber) {
    alert('Please select a room to check out.');
    return;
  }
  
  const rooms = getRooms();
  const roomIndex = rooms.findIndex(room => room.roomNumber == selectedRoomNumber);
  
  if (roomIndex === -1) {
    alert('Room not found.');
    return;
  }
  
  const room = rooms[roomIndex];
  
  // Update room status
  rooms[roomIndex] = {
    roomNumber: room.roomNumber,
    status: 'available',
    guestName: '',
    checkin: '',
    checkout: '',
    roomType: '',
    guests: 0,
    beds: 0,
    pillows: 0,
    payment: ''
  };
  
  saveRooms(rooms);
  
  // Update daily check-out count
  const today = new Date().toDateString();
  const dailyData = JSON.parse(localStorage.getItem('dailyData') || '{}');
  if (!dailyData[today]) {
    dailyData[today] = { checkIns: 0, checkOuts: 0 };
  }
  dailyData[today].checkOuts += 1;
  localStorage.setItem('dailyData', JSON.stringify(dailyData));
  
  // Update displays
  updateHotelStatus();
  updateCheckoutDropdown();
  
  alert(`Room ${room.roomNumber} has been checked out successfully!`);
}

function calculatePrice() {
  const checkin = new Date(document.getElementById('checkin').value);
  const checkout = new Date(document.getElementById('checkout').value);
  if (checkout <= checkin) {
    alert('Check-out must be after check-in.');
    return;
  }
  const nights = Math.max(1, Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24)));
  const roomType = document.getElementById('roomType').value;
  const beds = parseInt(document.getElementById('beds').value);
  const pillows = parseInt(document.getElementById('pillows').value);
  const payment = document.getElementById('payment').value;
  const guestName = document.getElementById('guestName').value;

  const base = PRICES[roomType];
  const roomCharge = base * nights;
  const bedCharge = PRICES.bed * beds * nights;
  const pillowCharge = PRICES.pillow * pillows;
  const subtotal = roomCharge + bedCharge + pillowCharge;
  const tax = subtotal * PRICES.tax / 100;
  const total = subtotal + tax;

  document.getElementById('priceDisplay').innerText = `Total: ₹${total.toFixed(2)} (for ${nights} night${nights>1?'s':''})`;

  let summary = `------ Booking Summary ------\n`;
  summary += `Guest Name: ${guestName}\nCheck-in: ${checkin}\nCheck-out: ${checkout}\nNights: ${nights}\n`;
  summary += `Room: ${roomType.toUpperCase()}\nExtra beds: ${beds}\nExtra pillows: ${pillows}\n\n`;
  summary += `Room charge: ₹${roomCharge.toFixed(2)}\nBeds charge: ₹${bedCharge.toFixed(2)}\n`;
  summary += `Pillows charge: ₹${pillowCharge.toFixed(2)}\nTax (12%): ₹${tax.toFixed(2)}\nTotal payable: ₹${total.toFixed(2)}\n\n`;
  summary += `Payment method: ${payment === 'online' ? 'Online Payment' : 'Cash at Hotel'}\n\n`;
  summary += `Included items: Tooth brush, Soap, Tooth paste, Towel, Television (TV), Washing Services, Free Wi-Fi, 24 hrs Room Service.`;
  document.getElementById('summary').innerText = summary;
}

function confirmBooking() {
  if (document.getElementById('summary').innerText.trim() === '') {
    alert('Please calculate price before confirming.');
    return;
  }
  
  const guestName = document.getElementById('guestName').value;
  if (!guestName.trim()) {
    alert('Please enter guest name.');
    return;
  }
  
  // Find available room
  const availableRoom = findAvailableRoom();
  if (!availableRoom) {
    alert('All rooms are currently booked.');
    return;
  }
  
  const payment = document.getElementById('payment').value;
  if (payment === 'online') {
    alert('Redirecting to online payment (simulated). Payment successful!');
  } else {
    alert('Please pay at the hotel during check-in.');
  }
  
  // Assign room and update booking details
  const rooms = getRooms();
  const roomIndex = rooms.findIndex(room => room.roomNumber === availableRoom.roomNumber);
  
  const checkin = document.getElementById('checkin').value;
  const checkout = document.getElementById('checkout').value;
  const roomType = document.getElementById('roomType').value;
  const guests = parseInt(document.getElementById('guests').value);
  const beds = parseInt(document.getElementById('beds').value);
  const pillows = parseInt(document.getElementById('pillows').value);
  
  rooms[roomIndex] = {
    roomNumber: availableRoom.roomNumber,
    status: 'booked',
    guestName: guestName,
    checkin: checkin,
    checkout: checkout,
    roomType: roomType,
    guests: guests,
    beds: beds,
    pillows: pillows,
    payment: payment
  };
  
  saveRooms(rooms);
  
  // Update daily check-in count
  const today = new Date().toDateString();
  const dailyData = JSON.parse(localStorage.getItem('dailyData') || '{}');
  if (!dailyData[today]) {
    dailyData[today] = { checkIns: 0, checkOuts: 0 };
  }
  dailyData[today].checkIns += 1;
  localStorage.setItem('dailyData', JSON.stringify(dailyData));
  
  // Update displays
  updateHotelStatus();
  updateCheckoutDropdown();
  
  // Update summary with room number
  const summaryElement = document.getElementById('summary');
  let summaryText = summaryElement.innerText;
  summaryText = summaryText.replace('------ Booking Summary ------', `------ Booking Summary ------\nRoom Assigned: ${availableRoom.roomNumber}`);
  summaryElement.innerText = summaryText;
  
  alert(`Booking confirmed! Room ${availableRoom.roomNumber} has been assigned to ${guestName}. Thank you for choosing Royal Hotel Booking Services.`);
}

// Initialize hotel data when page loads
window.addEventListener('load', initializeHotelData);
