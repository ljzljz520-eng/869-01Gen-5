import { useMemo, useState } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Button, Input, Textarea, Slider } from '@tarojs/components';
import { useMonitorStore } from '@/store/monitorStore';
import { VersionService } from '@/services/versionService';
import { ProgressBar } from '@/components/ProgressBar';
import { GrayVersion, GrayRule } from '@/types/monitor';
import styles from './index.module.scss';

const AVAILABLE_REGIONS = [
  '北京', '上海', '广州', '深圳', '杭州',
  '成都', '武汉', '西安', '南京', '重庆',
  '苏州', '郑州', '长沙', '东莞', '天津'
];

const GRAY_STRATEGIES = [
  {
    key: 'gradual',
    title: '渐进式放量',
    desc: '按5%→20%→50%→100%的节奏逐步放量，每阶段观察24小时'
  },
  {
    key: 'fast',
    title: '快速放量',
    desc: '直接按目标比例推送，适合紧急修复或小版本更新'
  },
  {
    key: 'manual',
    title: '手动控制',
    desc: '完全手动调整灰度比例，适合需要精细控制的大版本'
  }
];

const DEFAULT_RULES: GrayRule[] = [
  {
    id: 'rule_new_user',
    name: '新用户优先',
    description: '注册7天内的用户优先进入灰度',
    type: 'userTag',
    config: { tag: 'newUser', priority: 1 },
    enabled: true
  },
  {
    id: 'rule_high_active',
    name: '活跃用户优先',
    description: '近7天活跃≥3次的用户优先进入灰度',
    type: 'userTag',
    config: { tag: 'highActive', priority: 2 },
    enabled: false
  },
  {
    id: 'rule_vip_user',
    name: 'VIP用户优先',
    description: '付费VIP用户优先进入灰度体验新功能',
    type: 'userTag',
    config: { tag: 'vip', priority: 3 },
    enabled: false
  }
];

export default function VersionCreatePage() {
  const store = useMonitorStore();

  const [versionCode, setVersionCode] = useState('2.4.0');
  const [versionName, setVersionName] = useState('全新首页改版');
  const [description, setDescription] = useState('1. 首页整体视觉风格升级\n2. 新增智能推荐模块\n3. 优化启动速度30%\n4. 修复若干已知问题');
  const [targetPercentage, setTargetPercentage] = useState(30);
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['北京', '上海', '深圳']);
  const [selectedStrategy, setSelectedStrategy] = useState('gradual');
  const [selectedRules, setSelectedRules] = useState<string[]>(['rule_new_user']);

  const formValid = useMemo(() => {
    return versionCode.trim() !== '' && versionName.trim() !== '';
  }, [versionCode, versionName]);

  const previewRules = useMemo(() => {
    return DEFAULT_RULES.filter(r => selectedRules.includes(r.id));
  }, [selectedRules]);

  const handleToggleRegion = (region: string) => {
    setSelectedRegions(prev => {
      if (prev.includes(region)) {
        return prev.filter(r => r !== region);
      }
      return [...prev, region];
    });
  };

  const handleToggleRule = (ruleId: string) => {
    setSelectedRules(prev => {
      if (prev.includes(ruleId)) {
        return prev.filter(r => r !== ruleId);
      }
      return [...prev, ruleId];
    });
  };

  const handleSaveDraft = () => {
    const newVersion = store.createVersion({
      versionCode,
      versionName,
      description,
      targetPercentage,
      allowedRegions: selectedRegions,
      rules: DEFAULT_RULES.map(r => ({ ...r, enabled: selectedRules.includes(r.id) }))
    });
    Taro.showToast({ title: '草稿已保存', icon: 'success' });
    setTimeout(() => {
      store.setSelectedVersion(newVersion.id);
      Taro.navigateBack();
    }, 800);
  };

  const handlePublish = () => {
    if (!formValid) {
      Taro.showToast({ title: '请填写版本号和版本名称', icon: 'none' });
      return;
    }
    if (selectedRegions.length === 0) {
      Taro.showToast({ title: '请至少选择一个定向地区', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '确认发布灰度',
      content: `即将发布 v${versionCode}「${versionName}」，定向 ${selectedRegions.length} 个地区，目标灰度 ${targetPercentage}%，确认继续吗？`,
      confirmText: '确认发布',
      confirmColor: '#165DFF',
      success: (res) => {
        if (res.confirm) {
          const newVersion = store.createVersion({
            versionCode,
            versionName,
            description,
            targetPercentage,
            allowedRegions: selectedRegions,
            rules: DEFAULT_RULES.map(r => ({ ...r, enabled: selectedRules.includes(r.id) }))
          });
          VersionService.publish(newVersion.id);
          Taro.showToast({ title: '灰度发布成功', icon: 'success' });
          setTimeout(() => {
            store.setSelectedVersion(newVersion.id);
            Taro.navigateBack();
          }, 1000);
        }
      }
    });
  };

  return (
    <View className={styles.container}>
      <View className={styles.content}>
        <View className={styles.previewCard}>
          <Text className={styles.previewLabel}>发布预览</Text>
          <Text className={styles.previewVersion}>v{versionCode || '--'}</Text>
          <Text className={styles.previewName}>{versionName || '请输入版本名称'}</Text>
          <ProgressBar
            percentage={0}
            targetPercentage={targetPercentage}
            showLabel
            size="small"
          />
          <View className={styles.previewMeta} style={{ marginTop: '$spacing-md' }}>
            <Text className={styles.previewTag}>目标: {targetPercentage}%</Text>
            <Text className={styles.previewTag}>地区: {selectedRegions.length}个</Text>
            <Text className={styles.previewTag}>规则: {selectedRules.length}条</Text>
          </View>
        </View>

        <View className={styles.formCard} style={{ marginTop: '$spacing-lg' }}>
          <Text className={styles.formTitle}>
            <Text className={styles.formTitleIcon}></Text>
            基本信息
          </Text>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.formRequired}>*</Text>版本号
            </Text>
            <Input
              className={styles.formInput}
              placeholder="如：2.4.0"
              value={versionCode}
              onInput={(e) => setVersionCode(e.detail.value)}
            />
            <Text className={styles.formHint}>遵循语义化版本规范：主版本号.次版本号.修订号</Text>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.formRequired}>*</Text>版本名称
            </Text>
            <Input
              className={styles.formInput}
              placeholder="简短描述本次版本主题"
              value={versionName}
              onInput={(e) => setVersionName(e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>版本描述</Text>
            <Textarea
              className={styles.formTextarea}
              placeholder="详细描述本次更新内容、优化项和修复项"
              value={description}
              onInput={(e) => setDescription(e.detail.value)}
              maxlength={500}
              autoHeight
            />
          </View>
        </View>

        <View className={styles.formCard}>
          <Text className={styles.formTitle}>
            <Text className={styles.formTitleIcon} style={{ background: '#00B42A' }}></Text>
            灰度策略
          </Text>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.formRequired}>*</Text>目标灰度比例
            </Text>
            <View className={styles.sliderRow}>
              <Text className={styles.formHint}>0%</Text>
              <Slider
                style={{ flex: 1 }}
                min={1}
                max={100}
                step={1}
                value={targetPercentage}
                activeColor="#165DFF"
                backgroundColor="#E5E6EB"
                blockColor="#165DFF"
                blockSize={24}
                onChange={(e) => setTargetPercentage(e.detail.value)}
              />
              <Text className={styles.sliderValue}>{targetPercentage}%</Text>
            </View>
            <Text className={styles.formHint}>建议从小比例开始，观察24小时稳定性后逐步提升</Text>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>放量节奏</Text>
            <View className={styles.radioGroup}>
              {GRAY_STRATEGIES.map(strategy => (
                <View
                  key={strategy.key}
                  className={`${styles.radioOption} ${selectedStrategy === strategy.key ? styles.radioOptionSelected : ''}`}
                  onClick={() => setSelectedStrategy(strategy.key)}
                >
                  <View
                    className={`${styles.radioDot} ${selectedStrategy === strategy.key ? styles.radioDotSelected : ''}`}
                  />
                  <View className={styles.radioContent}>
                    <Text className={styles.radioTitle}>{strategy.title}</Text>
                    <Text className={styles.radioDesc}>{strategy.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className={styles.formCard}>
          <Text className={styles.formTitle}>
            <Text className={styles.formTitleIcon} style={{ background: '#722ED1' }}></Text>
            定向地区（可多选）
          </Text>
          <Text className={styles.formHint} style={{ marginBottom: '$spacing-md' }}>
            只向选定地区用户推送灰度版本，不选则默认全国
          </Text>
          <View className={styles.tagSelector}>
            {AVAILABLE_REGIONS.map(region => (
              <View
                key={region}
                className={`${styles.tagOption} ${selectedRegions.includes(region) ? styles.tagOptionSelected : ''}`}
                onClick={() => handleToggleRegion(region)}
              >
                {region}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formCard}>
          <Text className={styles.formTitle}>
            <Text className={styles.formTitleIcon} style={{ background: '#FF7D00' }}></Text>
            灰度规则（可多选）
          </Text>
          <Text className={styles.formHint} style={{ marginBottom: '$spacing-md' }}>
            选中的规则将作为灰度人群筛选条件
          </Text>
          <View className={styles.radioGroup}>
            {DEFAULT_RULES.map(rule => (
              <View
                key={rule.id}
                className={`${styles.radioOption} ${selectedRules.includes(rule.id) ? styles.radioOptionSelected : ''}`}
                onClick={() => handleToggleRule(rule.id)}
              >
                <View
                  className={`${styles.radioDot} ${selectedRules.includes(rule.id) ? styles.radioDotSelected : ''}`}
                />
                <View className={styles.radioContent}>
                  <Text className={styles.radioTitle}>{rule.name}</Text>
                  <Text className={styles.radioDesc}>{rule.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.actionBar}>
        <Button className={`${styles.actionBtn} ${styles.btnOutline}`} onClick={handleSaveDraft}>
          保存草稿
        </Button>
        <Button
          className={`${styles.actionBtn} ${styles.btnPrimary}`}
          onClick={handlePublish}
          disabled={!formValid}
        >
          立即发布灰度
        </Button>
      </View>
    </View>
  );
}
