const { eq } = require('drizzle-orm');
// Just a simple node script to test JS logical behavior
// If goalTargetValue is 0
let formInput = "0";
let savedTarget = Number(formInput || 100);
console.log("If input is '0', Number('0' || 100) evaluates to:", savedTarget);
