# Robot URDF Studio

### ▶ [Open the app](https://srivatsa-dotcom.github.io/robot-urdf-studio/)

No install needed. Click the link, design your robot, and download the ROS 2 package.

A single-page web app that generates URDF models and ready-to-build ROS 2 packages for:

- 2-wheel drive (differential drive + caster)
- 4-wheel drive (skid-steer)
- 6-DOF robotic arm (optional parallel gripper)
- Humanoid (23 DOF biped)
- Semi-humanoid (humanoid upper body on a wheeled base)

Enter the robot's dimensions and masses, check it in the live 3D preview (with joint sliders and geometry checks), pick RViz, Gazebo, or both, and download a zip containing:

- `urdf/<robot>.urdf` with inertia computed from geometry, plus Gazebo plugins (diff drive, joint position controllers, lidar/camera/IMU) when Gazebo is selected
- `launch/display.launch.py` (robot_state_publisher + joint_state_publisher_gui + RViz)
- `launch/gazebo.launch.py` (Gazebo + spawn + ros_gz_bridge, optional RViz)
- `worlds/empty.sdf`, `rviz/*.rviz`, `package.xml`, `CMakeLists.txt`, `README.md`
- `robot_spec.json` to re-import and edit later

For the 6-DOF arm, humanoid and semi-humanoid it can also generate a `<robot>_moveit_config` package:

- SRDF with planning groups (arm/gripper, left/right arm, head, torso, legs), named poses and a collision matrix
- KDL kinematics, joint limits, ros2_control with mock hardware (RViz demo) or `gz_ros2_control` (Gazebo)
- One `JointTrajectoryController` per group, wired to MoveIt
- `demo.launch.py` (MoveIt + RViz, no physics) and `gazebo.launch.py` (Gazebo + MoveIt + RViz)

Gazebo worlds included in every package (pick the default in the app, switch at launch with `world:=<name>`):

| World | Contents |
|---|---|
| `empty` | Flat ground |
| `factory` | Conveyor lines, CNC machines, work tables, bin racks, marked robot cell |
| `warehouse` | Four rows of pallet racks with boxes, 2 m aisles, floor lanes, loading dock |
| `office` | Desk clusters with monitors and chairs, meeting room, cabinets, sofa, plants |

Worlds are built from simple shapes, so they load offline with no model downloads.

### Custom map from your phone

Pick **Custom map** in Step 3. There are two ways to get a map:

**Import a 3D scan (any phone, including iPhone).** Scan the room with a free app such as Scaniverse (exports OBJ, PLY or STL for free, no LiDAR needed) or Polycam (free plan exports GLB). Keep people and pets out of view, since imported files are not filtered. Then either:

- open the **From your phone (QR)** tab and pick **iPhone**: it lists the Scaniverse steps and shows a QR code. Scan it (same Wi-Fi), tap **Send scan file** and pick the scan; it opens on the computer straight away, or
- copy the file to the computer and choose it in the **Import a 3D scan** tab.

Click the map where the robot starts and rotate until its forward direction points up. Up axis, units and upside-down are detected automatically and can be corrected.

**Scan live with an Android phone** (pick **Android** in the QR tab):

1. A QR code appears. Scan it with your phone (same Wi-Fi as the computer).
2. On the phone, stand where the robot should start, face its forward direction and tap **Start scan**.
3. Walk slowly and sweep over walls and furniture. The computer shows the map growing live.
4. Tap **Finish**, then **Use this map**.

The package then also contains `worlds/custom.sdf` (every obstacle the phone saw, as static blocks) and `maps/custom_map.pgm/.yaml` (a 5 cm Nav2 occupancy map). The scan start point is the map origin and the robot spawn point.

How it works and what it needs:

- **Same Wi-Fi only.** Phone and computer connect peer-to-peer over WebRTC with no STUN/TURN servers, so the connection only succeeds on the same local network. A public PeerJS server is used for a few seconds to pair the devices; the scan data never passes through it. Guest networks with client isolation block the connection.
- **Phone:** Chrome on Android with ARCore (Google Play Services for AR). The scan uses WebXR depth sensing, detected planes, or hit-testing on phones without a depth API.
- **iPhone:** browsers on iPhone have no WebXR, so iPhones scan with Scaniverse and send the file (pick **iPhone** in the QR tab for the steps).
- **People and animals are left out.** Each sampled camera frame runs through an on-device DeepLab v3 segmenter (MediaPipe); depth points on a person, cat, dog, bird, horse, cow or sheep (plus a small margin) are dropped before they reach the map. If a phone cannot give the browser camera frames during AR, the scan stops and offers to continue without the filter.
- **Privacy:** only 3D points leave the phone, never camera images.
- **HTTPS:** the phone page must come from an HTTPS site (GitHub Pages), because browsers only allow the camera on secure pages. Scanning does not work inside the Claude artifact viewer.

Supports ROS 2 Jazzy (Gazebo Harmonic) and Humble (Gazebo Fortress).

## Run locally (optional)

```bash
python3 serve.py
```

It prints an address like `http://192.168.1.23:8000/`. Open that on your computer (not `localhost`), so a phone on the same Wi-Fi can open the QR link and send scan files. Live Android scanning needs HTTPS, so it only works from GitHub Pages.

It loads three.js and JSZip from public CDNs, so it needs internet access.

## Build a generated package

```bash
mkdir -p ~/ros2_ws/src && cd ~/ros2_ws/src
unzip ~/Downloads/<package>.zip
cd ~/ros2_ws && colcon build --packages-select <package>
source install/setup.bash
ros2 launch <package> display.launch.py   # RViz
ros2 launch <package> gazebo.launch.py    # Gazebo
```

## Colors

The colors you pick in the app are written into every `<visual>` of the URDF, so RViz and Gazebo show the same colors as the preview. If a part shows up plain white in RViz, RViz has no transform for that link yet: check that the joint states are being published (the joint slider window for RViz, or the Gazebo bridge for simulation).
