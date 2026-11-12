export const adminAvatars = [
  { key: 'engineer', label: '工程师', position: '0% 0%' },
  { key: 'inspector', label: '检验员', position: '50% 0%' },
  { key: 'robot', label: '机器人', position: '100% 0%' },
  { key: 'astronaut', label: '宇航员', position: '0% 100%' },
  { key: 'bear', label: '小熊', position: '50% 100%' },
  { key: 'cat', label: '小猫', position: '100% 100%' },
];
export const adminAvatar = key => adminAvatars.find(avatar => avatar.key === key) || adminAvatars[0];
