console.log(eth.blockNumber);

eth.subscribe('logs', {
	address: "0xee40bddc9273657a1392fa326d47e8b98cad11c9",
	topics: ["0x7c030f3f8c902fa5a59193f1e3c08ae7245fc0e3b7ab290b6a9548a57a46ac60"]
}, function(error, result) {
	if (!error) console.log(result);
});