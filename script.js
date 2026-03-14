let player;
let lastTime = 0;
let keyPressed = {};
let camera;

let camPos = { x: 0, y: 7, z: 10 };
let camAngleY = 0;

window.onload = function () {
    const scene = document.querySelector("a-scene");
    player = new Sedan(0, 0, 90);
    scene.appendChild(player.obj);
    camera = document.querySelector("#camera");

    loop();
};

document.addEventListener('keydown', (event) => { keyPressed[event.key] = true });
document.addEventListener('keyup', (event) => { keyPressed[event.key] = false });

function handleAcceleration(dt) {
    if (keyPressed['ArrowUp'] || keyPressed['w']) {
        // If moving backward and press UP, apply braking
        if (player.velocity.x < 0) {
            player.acceleration = player.brake_deceleration;
        } else {
            player.acceleration += player.acceleration_factor * dt;
        }

    } else if (keyPressed['ArrowDown'] || keyPressed['s']) {
        // If moving forward and press DOWN, apply braking
        if (player.velocity.x > 0) {
            player.acceleration = -player.brake_deceleration;
        } else {
            player.acceleration -= player.acceleration_factor * dt;
        }

    } else {
        // Apply regular braking if the braking won't reverse velocity
        if (player.brake_deceleration * dt < Math.abs(player.velocity.x)) {
            player.acceleration = -Math.sign(player.velocity.x) * player.brake_deceleration;

            // When the player is moving slowly
        } else {
            if (dt !== 0) {
                // Calculate exact deceleration needed to stop
                player.acceleration = -player.velocity.x / dt;
            } else {
                player.acceleration = 0;
            }
        }

    }

    // Limit acceleration
    player.acceleration = Math.max(-player.max_acceleration, Math.min(player.acceleration, player.max_acceleration));
}

function handleSteering(dt) {
    if (keyPressed['ArrowRight'] || keyPressed['d']) {
        player.steering -= player.steering_factor * dt;
    } else if (keyPressed['ArrowLeft'] || keyPressed['a']) {
        player.steering += player.steering_factor * dt;
    } else {
        // Gradually return steering to 0
        if (Math.abs(player.steering) < player.steering_factor * dt) {
            player.steering = 0;
        } else {
            player.steering -= Math.sign(player.steering) * player.steering_factor * dt;
        }
    }

    // Limit steering
    player.steering = Math.max(-player.max_steering, Math.min(player.steering, player.max_steering));
}

function updateCamera(dt) {
    const lerpFactor = keyPressed[' '] ? 20 : 10;

    let camOffset = new Vector(-10, 0).rotate(-player.angle);
    let targetX = player.position.x + camOffset.x;
    let targetY = player.y + 7;
    let targetZ = player.position.z + camOffset.z;

    // Lerp position
    camPos.x += (targetX - camPos.x) * lerpFactor * dt;
    camPos.y += (targetY - camPos.y) * lerpFactor * dt;
    camPos.z += (targetZ - camPos.z) * lerpFactor * dt;

    // Lerp angle — handle wrap-around at ±180°
    let targetAngleY = player.angle - 90;
    let angleDiff = targetAngleY - camAngleY;

    // Normalize the difference to [-180, 180] to prevent spinning
    while (angleDiff > 180) angleDiff -= 360;
    while (angleDiff < -180) angleDiff += 360;

    camAngleY += angleDiff * lerpFactor * dt;

    camera.setAttribute("position", `${camPos.x} ${camPos.y} ${camPos.z}`);
    camera.setAttribute("rotation", `-30 ${camAngleY} 0`);
}

function loop() {
    const currentTime = performance.now();
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    handleAcceleration(dt);
    handleSteering(dt);
    updateCamera(dt);

    player.update(dt);

    requestAnimationFrame(loop);
}