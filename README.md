# Robot URDF Studio

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

Supports ROS 2 Jazzy (Gazebo Harmonic) and Humble (Gazebo Fortress).

## Run

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
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
