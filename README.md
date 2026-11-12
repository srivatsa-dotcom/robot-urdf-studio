# Robot URDF Studio

### ▶ [Open the app](https://robot-urdf-studio.vercel.app)

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

### Your own world (.sdf)

Pick **Your own world** in Step 3 (or drag a file onto the world picker) and upload:

- a Gazebo world file (`.sdf` or `.world`), or
- a `.zip` that holds the world file together with the models and meshes it uses (keep the folder layout the world expects).

The app then:

- shows the world's boxes, cylinders and spheres in the 3D preview and uses them for the RL training map (meshes and `<include>` models still load in Gazebo, they just are not drawn in the browser);
- renames the world to `default` inside the file, so the launch files, bridges and RL kit find it;
- adds any Gazebo systems the robot needs that the file is missing (physics, user commands, scene broadcaster, sensors, IMU), using the right names for Harmonic or Fortress;
- packs the zip's other files into `worlds/custom_assets/`, rewrites relative mesh paths to point there, and adds that folder (and `custom_assets/models`) to the Gazebo resource path so `model://` URIs resolve;
- lets you set where the robot starts (x, y and heading), which become the defaults of the launch file's `x`, `y` and `yaw` arguments.

Launch it with `world:=custom`. Files with absolute paths (`file:///home/...`) only work on the computer they point to.

## Reinforcement learning (Step 4)

Tick **Add an RL training kit** and the download gets a `<robot>_rl/` folder next to the ROS packages: a [Gymnasium](https://gymnasium.farama.org) task trained with [Stable-Baselines3](https://stable-baselines3.readthedocs.io) (PPO or SAC).

| Robot | Task | What the policy learns |
|---|---|---|
| 2-wheel and 4-wheel drive | Drive to goals | Reach random goals anywhere in the chosen world (factory, warehouse, office or your own .sdf world) without touching anything, steering by lidar |
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

`index.html` is a single file: open it in a browser, or serve the folder with any static server, for example

```bash
python3 -m http.server 8000
```

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
