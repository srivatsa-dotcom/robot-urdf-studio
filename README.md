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
- optionally `<robot>_rl/`, a reinforcement learning kit (see below)

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

**Import a 3D scan (any phone, including iPhone).** Scan the room with a free app such as Scaniverse (exports OBJ, PLY or STL for free, no LiDAR needed; its OBJ comes as a .zip, which the app opens directly) or Polycam (free plan exports GLB). Keep people and pets out of view, since imported files are not filtered. Then either:

- open the **From your phone (QR)** tab and pick **iPhone**: it lists the Scaniverse steps and shows a QR code. Scan it (same Wi-Fi), tap **Send scan file** and pick the scan; it opens on the computer straight away, or
- copy the file to the computer and choose it in the **Import a 3D scan** tab.

Click the map where the robot starts and rotate until its forward direction points up. Up axis, units and upside-down are detected automatically and can be corrected.

**Scan live with an Android phone** (pick **Android** in the QR tab):

1. A QR code appears. Scan it with your phone (same Wi-Fi as the computer).
2. On the phone, stand where the robot should start, face its forward direction and tap **Start scan**.
3. Walk slowly and sweep over walls and furniture. The computer shows the map growing live.
4. Tap **Finish**, then **Use this map**.

The package then also contains `worlds/custom.sdf` and `maps/custom_map.pgm/.yaml` (a 5 cm Nav2 occupancy map). The scan start point is the map origin and the robot spawn point.

For imported scans in OBJ or STL (and GLB on Jazzy), the Gazebo world shows the **real scanned mesh with its textures** (`worlds/custom_scan/`), so simulated cameras and lidar see your actual room; the ceiling is cut off above 2.3 m. Collisions use simplified invisible blocks so physics stays fast.

Imported meshes are cleaned when you click **Use this map**: the floor plane is found and the scan is levelled (tilt corrected), the floor height is set so wheels sit on top of small bumps, the ceiling is cut, and loose scraps (tiny pieces or pieces outside the room's footprint) are removed. The Nav2 map drops obstacle specks smaller than 0.02 m², closes one-cell gaps in walls, and ignores anything lower than 10 cm above the floor. Live Android scans and PLY point clouds use visible blocks instead.

How it works and what it needs:

- **Same Wi-Fi only.** Phone and computer connect peer-to-peer over WebRTC with no STUN/TURN servers, so the connection only succeeds on the same local network. A public PeerJS server is used for a few seconds to pair the devices; the scan data never passes through it. Guest networks with client isolation block the connection.
- **Phone:** Chrome on Android with ARCore (Google Play Services for AR). The scan uses WebXR depth sensing, detected planes, or hit-testing on phones without a depth API.
- **iPhone:** browsers on iPhone have no WebXR, so iPhones scan with Scaniverse and send the file (pick **iPhone** in the QR tab for the steps).
- **People and animals are left out.** Each sampled camera frame runs through an on-device DeepLab v3 segmenter (MediaPipe); depth points on a person, cat, dog, bird, horse, cow or sheep (plus a small margin) are dropped before they reach the map. If a phone cannot give the browser camera frames during AR, the scan stops and offers to continue without the filter.
- **Privacy:** only 3D points leave the phone, never camera images.
- **HTTPS:** the phone page must come from an HTTPS site (GitHub Pages), because browsers only allow the camera on secure pages. Scanning does not work inside the Claude artifact viewer.

Supports ROS 2 Jazzy (Gazebo Harmonic) and Humble (Gazebo Fortress).

## Reinforcement learning (Step 4)

Tick **Add an RL training kit** and the download gets a `<robot>_rl/` folder next to the ROS packages: a [Gymnasium](https://gymnasium.farama.org) task trained with [Stable-Baselines3](https://stable-baselines3.readthedocs.io) (PPO or SAC).

| Robot | Task | What the policy learns |
|---|---|---|
| 2-wheel and 4-wheel drive | Drive to goals | Reach random goals anywhere in the chosen world (factory, warehouse, office or your scanned room) without touching anything, steering by lidar |
| 6-DOF arm, humanoid | Reach targets | Move the tool or right hand to random points in its workspace |
| Semi-humanoid | Either | Drive its base to goals, or reach with its right arm |

Two simulators share the same observations, actions and rewards, so a policy moves between them unchanged:

- **Fast trainer:** a lightweight simulator built from the world's occupancy map (or the arm's kinematics). It runs thousands of steps per second on a laptop CPU, so a policy trains in minutes with no Gazebo.
- **Gazebo:** the real simulation through ROS 2. It is used to fine-tune and run the policy. Episodes restart by teleporting the robot with Gazebo's `set_pose` service, or by sending the arm home.

For driving, the kit plans the shortest route on the map and guides the policy along it, while the policy handles speed, steering and avoiding what the lidar sees. This is the same global-planner-plus-local-controller split that real robots use.

```bash
cd ~/ros2_ws/src/<robot>_rl
python3 -m venv --system-site-packages .venv && source .venv/bin/activate
pip install -r requirements.txt
python train.py                  # fast trainer
python run_policy.py             # watch it, get a success rate
python train.py --backend gazebo --resume $(cat runs/LATEST)/best_model.zip   # fine-tune with Gazebo running
```

The Step 4 panel previews the training arena (map, start and goal spots, or the arm's reachable targets) and lets you pick the algorithm, training steps, episode length and Gazebo speed. Everything else, including rewards, speeds and hyperparameters, lives in the kit's `config.yaml`.

## Run locally (optional)

```bash
python3 serve.py
```

It prints an address like `http://192.168.1.23:8000/`. Open that on your computer (not `localhost`), so a phone on the same Wi-Fi can open the QR link and send scan files. Live Android scanning needs HTTPS, so it only works from GitHub Pages.

It loads three.js and JSZip from public CDNs, so it needs internet access.

## Shared scans (customers share custom maps with you)

Customers can click **Share this map with the app owner** under the world picker. After ticking a consent box, their cleaned scan (3D shape, textures and map) is uploaded to your Firebase Storage. They need no account: their browser gets an anonymous ID, so they can delete what they shared. You open **Owner: shared scans** at the bottom of the page, sign in with Google, and can open any shared scan as your custom map or delete it. Only the Google account named in `storage.rules` can see other people's scans.

Sharing works on the GitHub Pages site (and `serve.py`), not inside the Claude artifact viewer.

### One-time setup (on your existing Google Cloud project)

1. Go to <https://console.firebase.google.com>, click **Add project**, and pick your existing Google Cloud project.
2. Switch the project to the **Blaze** (pay-as-you-go) plan. Firebase needs it for file storage on new projects; it bills your Google Cloud account, and small use stays within the free quota (about 5 GB stored). Set a budget alert in Google Cloud > Billing > Budgets so you're warned of any charges.
3. **Build > Authentication > Get started > Sign-in method:** enable **Anonymous** and **Google**. Under **Settings > Authorized domains**, add `srivatsa-dotcom.github.io` (and your computer's IP if you use `serve.py`).
4. **Build > Storage > Get started:** choose production mode and a location near you.
5. **Storage > Rules:** paste [`storage.rules`](storage.rules), replace `OWNER_EMAIL` with your Google email, and click **Publish**. Customers can only upload `.zip` scans under 60 MB into their own folder.
6. **Project settings > General > Your apps > Add app > Web:** register the app and copy the `firebaseConfig` values into [`firebase-config.js`](firebase-config.js). These values are public by design; the rules protect the data.
7. Allow the owner page to download scans: open **Cloud Shell** in the Google Cloud console, create `cors.json` with the contents of [`cors.json`](cors.json), and run
   ```bash
   gcloud storage buckets update gs://YOUR_PROJECT_ID.firebasestorage.app --cors-file=cors.json
   ```

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
