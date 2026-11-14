using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

namespace JuniorAstronaut.UI
{
    /// <summary>
    /// Surrounds the screen perimeter with 6 mission telemetry bars:
    /// Power, Hunger, Health, Food, Food Growth, and Radiation.
    /// Each bar displays a horizontal filling bar and numeric percentage value.
    /// </summary>
    [ExecuteAlways]
    public class ResourceHUDController : MonoBehaviour
    {
        public static ResourceHUDController Instance { get; private set; }

        [Header("Resource Percentages (0 - 100%)")]
        [SerializeField, Range(0f, 100f)] private float power = 85f;
        [SerializeField, Range(0f, 100f)] private float hunger = 25f;
        [SerializeField, Range(0f, 100f)] private float health = 95f;
        [SerializeField, Range(0f, 100f)] private float food = 70f;
        [SerializeField, Range(0f, 100f)] private float foodGrowth = 45f;
        [SerializeField, Range(0f, 100f)] private float radiation = 15f;

        [Header("Bar References")]
        [SerializeField] private ResourceBarUI powerBar;
        [SerializeField] private ResourceBarUI hungerBar;
        [SerializeField] private ResourceBarUI healthBar;
        [SerializeField] private ResourceBarUI foodBar;
        [SerializeField] private ResourceBarUI foodGrowthBar;
        [SerializeField] private ResourceBarUI radiationBar;

        [Header("HUD Canvas Reference")]
        [SerializeField] private Canvas hudCanvas;

        private readonly Dictionary<ResourceType, ResourceBarUI> barMap = new Dictionary<ResourceType, ResourceBarUI>();

        public float Power
        {
            get => power;
            set { power = Mathf.Clamp(value, 0f, 100f); SyncBar(ResourceType.Power, powerBar, power); }
        }

        public float Hunger
        {
            get => hunger;
            set { hunger = Mathf.Clamp(value, 0f, 100f); SyncBar(ResourceType.Hunger, hungerBar, hunger); }
        }

        public float Health
        {
            get => health;
            set { health = Mathf.Clamp(value, 0f, 100f); SyncBar(ResourceType.Health, healthBar, health); }
        }

        public float Food
        {
            get => food;
            set { food = Mathf.Clamp(value, 0f, 100f); SyncBar(ResourceType.Food, foodBar, food); }
        }

        public float FoodGrowth
        {
            get => foodGrowth;
            set { foodGrowth = Mathf.Clamp(value, 0f, 100f); SyncBar(ResourceType.FoodGrowth, foodGrowthBar, foodGrowth); }
        }

        public float Radiation
        {
            get => radiation;
            set { radiation = Mathf.Clamp(value, 0f, 100f); SyncBar(ResourceType.Radiation, radiationBar, radiation); }
        }

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        private static void EnsureHUDInScene()
        {
            if (FindFirstObjectByType<ResourceHUDController>() == null)
            {
                GameObject hudRoot = new GameObject("ResourceHUD");
                hudRoot.AddComponent<ResourceHUDController>();
            }
        }

        private void OnEnable()
        {
            Instance = this;
            EnsureUIBuilt();
            SyncAllBarsImmediate();
        }

        private void OnValidate()
        {
            RebuildBarLookup();
            SyncAllBarsImmediate();
        }

        /// <summary>
        /// Sets the percentage (0-100) for any of the 6 resources by enum type.
        /// </summary>
        public void SetResourcePercentage(ResourceType type, float percentage)
        {
            float clamped = Mathf.Clamp(percentage, 0f, 100f);
            switch (type)
            {
                case ResourceType.Power:
                    Power = clamped;
                    break;
                case ResourceType.Hunger:
                    Hunger = clamped;
                    break;
                case ResourceType.Health:
                    Health = clamped;
                    break;
                case ResourceType.Food:
                    Food = clamped;
                    break;
                case ResourceType.FoodGrowth:
                    FoodGrowth = clamped;
                    break;
                case ResourceType.Radiation:
                    Radiation = clamped;
                    break;
            }
        }

        public float GetResourcePercentage(ResourceType type)
        {
            return type switch
            {
                ResourceType.Power => power,
                ResourceType.Hunger => hunger,
                ResourceType.Health => health,
                ResourceType.Food => food,
                ResourceType.FoodGrowth => foodGrowth,
                ResourceType.Radiation => radiation,
                _ => 0f
            };
        }

        [ContextMenu("Rebuild Perimeter HUD")]
        public void RebuildHUD()
        {
            Transform existingCanvas = transform.Find("PerimeterHUDCanvas");
            if (existingCanvas != null)
            {
                if (Application.isPlaying)
                    Destroy(existingCanvas.gameObject);
                else
                    DestroyImmediate(existingCanvas.gameObject);
            }

            hudCanvas = null;
            powerBar = null;
            hungerBar = null;
            healthBar = null;
            foodBar = null;
            foodGrowthBar = null;
            radiationBar = null;

            EnsureUIBuilt();
            SyncAllBarsImmediate();
        }

        public void EnsureUIBuilt()
        {
            if (hudCanvas == null)
            {
                Transform existing = transform.Find("PerimeterHUDCanvas");
                if (existing != null)
                {
                    hudCanvas = existing.GetComponent<Canvas>();
                }
            }

            if (hudCanvas == null)
            {
                BuildPerimeterHUD();
            }

            RebuildBarLookup();
        }

        private void RebuildBarLookup()
        {
            barMap.Clear();
            if (powerBar != null) barMap[ResourceType.Power] = powerBar;
            if (hungerBar != null) barMap[ResourceType.Hunger] = hungerBar;
            if (healthBar != null) barMap[ResourceType.Health] = healthBar;
            if (foodBar != null) barMap[ResourceType.Food] = foodBar;
            if (foodGrowthBar != null) barMap[ResourceType.FoodGrowth] = foodGrowthBar;
            if (radiationBar != null) barMap[ResourceType.Radiation] = radiationBar;
        }

        private void SyncAllBarsImmediate()
        {
            if (powerBar != null) powerBar.SetPercentageImmediate(power);
            if (hungerBar != null) hungerBar.SetPercentageImmediate(hunger);
            if (healthBar != null) healthBar.SetPercentageImmediate(health);
            if (foodBar != null) foodBar.SetPercentageImmediate(food);
            if (foodGrowthBar != null) foodGrowthBar.SetPercentageImmediate(foodGrowth);
            if (radiationBar != null) radiationBar.SetPercentageImmediate(radiation);
        }

        private void SyncBar(ResourceType type, ResourceBarUI directRef, float pct)
        {
            if (directRef != null)
            {
                directRef.SetPercentage(pct);
                return;
            }

            if (barMap.TryGetValue(type, out ResourceBarUI mapped) && mapped != null)
            {
                mapped.SetPercentage(pct);
            }
        }

        private void BuildPerimeterHUD()
        {
            Font builtinFont = LoadDefaultFont();

            // 1. Root Canvas
            GameObject canvasGO = new GameObject("PerimeterHUDCanvas", typeof(RectTransform), typeof(Canvas), typeof(CanvasScaler), typeof(GraphicRaycaster));
            canvasGO.transform.SetParent(transform, false);
            canvasGO.layer = LayerMask.NameToLayer("UI") >= 0 ? LayerMask.NameToLayer("UI") : 5;

            hudCanvas = canvasGO.GetComponent<Canvas>();
            hudCanvas.renderMode = RenderMode.ScreenSpaceOverlay;
            hudCanvas.sortingOrder = 100;

            CanvasScaler scaler = canvasGO.GetComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1920f, 1080f);
            scaler.screenMatchMode = CanvasScaler.ScreenMatchMode.MatchWidthOrHeight;
            scaler.matchWidthOrHeight = 0.5f;

            // Ensure EventSystem exists in Play mode
            if (Application.isPlaying && FindFirstObjectByType<EventSystem>() == null)
            {
                GameObject es = new GameObject("EventSystem", typeof(EventSystem), typeof(StandaloneInputModule));
                es.transform.SetParent(transform, false);
            }

            // 2. Safe Frame Container surrounding the screen perimeter
            GameObject perimeterFrame = CreateUIObject("PerimeterFrame", canvasGO.transform);
            RectTransform frameRect = perimeterFrame.GetComponent<RectTransform>();
            StretchFullScreen(frameRect, 24f);

            // Subtle visor perimeter border lines (top, bottom, left, right) so the HUD frames the screen
            CreatePerimeterBorderLines(perimeterFrame.transform, builtinFont);

            // 3. Create the 6 Resource Bars positioned around the perimeter of the screen:
            // Top-Left: POWER
            powerBar = CreateResourceBarPanel(
                perimeterFrame.transform,
                builtinFont,
                ResourceType.Power,
                "POWER",
                power,
                new Color(0.98f, 0.80f, 0.18f, 1f), // Solar Gold / Yellow
                invertWarnings: false,
                anchorMin: new Vector2(0f, 1f),
                anchorMax: new Vector2(0f, 1f),
                pivot: new Vector2(0f, 1f),
                anchoredPos: new Vector2(0f, 0f),
                leftSideAccent: true);

            // Left-Middle: HEALTH
            healthBar = CreateResourceBarPanel(
                perimeterFrame.transform,
                builtinFont,
                ResourceType.Health,
                "HEALTH",
                health,
                new Color(0.22f, 0.88f, 0.48f, 1f), // Vitality Green
                invertWarnings: false,
                anchorMin: new Vector2(0f, 0.5f),
                anchorMax: new Vector2(0f, 0.5f),
                pivot: new Vector2(0f, 0.5f),
                anchoredPos: new Vector2(0f, 0f),
                leftSideAccent: true);

            // Bottom-Left: HUNGER
            hungerBar = CreateResourceBarPanel(
                perimeterFrame.transform,
                builtinFont,
                ResourceType.Hunger,
                "HUNGER",
                hunger,
                new Color(1.00f, 0.55f, 0.18f, 1f), // Amber Orange
                invertWarnings: true,
                anchorMin: new Vector2(0f, 0f),
                anchorMax: new Vector2(0f, 0f),
                pivot: new Vector2(0f, 0f),
                anchoredPos: new Vector2(0f, 0f),
                leftSideAccent: true);

            // Top-Right: RADIATION
            radiationBar = CreateResourceBarPanel(
                perimeterFrame.transform,
                builtinFont,
                ResourceType.Radiation,
                "RADIATION",
                radiation,
                new Color(0.88f, 0.28f, 0.92f, 1f), // Cosmic Magenta / Hazard
                invertWarnings: true,
                anchorMin: new Vector2(1f, 1f),
                anchorMax: new Vector2(1f, 1f),
                pivot: new Vector2(1f, 1f),
                anchoredPos: new Vector2(0f, 0f),
                leftSideAccent: false);

            // Right-Middle: FOOD
            foodBar = CreateResourceBarPanel(
                perimeterFrame.transform,
                builtinFont,
                ResourceType.Food,
                "FOOD",
                food,
                new Color(0.20f, 0.78f, 0.98f, 1f), // Cyan Supply Blue
                invertWarnings: false,
                anchorMin: new Vector2(1f, 0.5f),
                anchorMax: new Vector2(1f, 0.5f),
                pivot: new Vector2(1f, 0.5f),
                anchoredPos: new Vector2(0f, 0f),
                leftSideAccent: false);

            // Bottom-Right: FOOD GROWTH
            foodGrowthBar = CreateResourceBarPanel(
                perimeterFrame.transform,
                builtinFont,
                ResourceType.FoodGrowth,
                "FOOD GROWTH",
                foodGrowth,
                new Color(0.55f, 0.92f, 0.22f, 1f), // Hydroponic Lime Green
                invertWarnings: false,
                anchorMin: new Vector2(1f, 0f),
                anchorMax: new Vector2(1f, 0f),
                pivot: new Vector2(1f, 0f),
                anchoredPos: new Vector2(0f, 0f),
                leftSideAccent: false);
        }

        private void CreatePerimeterBorderLines(Transform parent, Font font)
        {
            Color frameLineColor = new Color(0.28f, 0.65f, 0.95f, 0.25f);

            // Top center telemetry header bar
            GameObject topHeader = CreateUIObject("TopPerimeterHeader", parent);
            RectTransform topRect = topHeader.GetComponent<RectTransform>();
            topRect.anchorMin = new Vector2(0.5f, 1f);
            topRect.anchorMax = new Vector2(0.5f, 1f);
            topRect.pivot = new Vector2(0.5f, 1f);
            topRect.anchoredPosition = new Vector2(0f, 0f);
            topRect.sizeDelta = new Vector2(520f, 36f);

            Image topBg = topHeader.AddComponent<Image>();
            topBg.color = new Color(0.04f, 0.08f, 0.15f, 0.78f);
            topBg.raycastTarget = false;

            GameObject topAccent = CreateUIObject("TopAccentLine", topHeader.transform);
            RectTransform topAccentRect = topAccent.GetComponent<RectTransform>();
            topAccentRect.anchorMin = new Vector2(0f, 1f);
            topAccentRect.anchorMax = new Vector2(1f, 1f);
            topAccentRect.pivot = new Vector2(0.5f, 1f);
            topAccentRect.anchoredPosition = Vector2.zero;
            topAccentRect.sizeDelta = new Vector2(0f, 3f);
            Image topAccentImg = topAccent.AddComponent<Image>();
            topAccentImg.color = new Color(0.30f, 0.78f, 1f, 0.8f);
            topAccentImg.raycastTarget = false;

            GameObject headerTextGO = CreateUIObject("HeaderTitle", topHeader.transform);
            RectTransform headerTextRect = headerTextGO.GetComponent<RectTransform>();
            StretchFullScreen(headerTextRect, 0f);
            Text headerText = headerTextGO.AddComponent<Text>();
            headerText.font = font;
            headerText.text = "JUNIOR ASTRONAUT // MISSION TELEMETRY HUD";
            headerText.fontSize = 15;
            headerText.fontStyle = FontStyle.Bold;
            headerText.alignment = TextAnchor.MiddleCenter;
            headerText.color = new Color(0.75f, 0.92f, 1f, 0.92f);
            headerText.raycastTarget = false;

            // Bottom center perimeter line
            GameObject bottomLine = CreateUIObject("BottomPerimeterLine", parent);
            RectTransform bottomRect = bottomLine.GetComponent<RectTransform>();
            bottomRect.anchorMin = new Vector2(0.25f, 0f);
            bottomRect.anchorMax = new Vector2(0.75f, 0f);
            bottomRect.pivot = new Vector2(0.5f, 0f);
            bottomRect.anchoredPosition = new Vector2(0f, 4f);
            bottomRect.sizeDelta = new Vector2(0f, 2f);
            Image bottomImg = bottomLine.AddComponent<Image>();
            bottomImg.color = frameLineColor;
            bottomImg.raycastTarget = false;
        }

        private ResourceBarUI CreateResourceBarPanel(
            Transform parent,
            Font font,
            ResourceType type,
            string title,
            float initialPercent,
            Color barColor,
            bool invertWarnings,
            Vector2 anchorMin,
            Vector2 anchorMax,
            Vector2 pivot,
            Vector2 anchoredPos,
            bool leftSideAccent)
        {
            GameObject cardGO = CreateUIObject($"{type}BarPanel", parent);
            RectTransform cardRect = cardGO.GetComponent<RectTransform>();
            cardRect.anchorMin = anchorMin;
            cardRect.anchorMax = anchorMax;
            cardRect.pivot = pivot;
            cardRect.anchoredPosition = anchoredPos;
            cardRect.sizeDelta = new Vector2(360f, 88f);

            // Outer card dark translucent background
            Image cardBg = cardGO.AddComponent<Image>();
            cardBg.color = new Color(0.05f, 0.09f, 0.16f, 0.86f);
            cardBg.raycastTarget = false;

            Outline cardOutline = cardGO.AddComponent<Outline>();
            cardOutline.effectColor = new Color(barColor.r, barColor.g, barColor.b, 0.35f);
            cardOutline.effectDistance = new Vector2(1.5f, -1.5f);

            // Side vertical accent stripe
            GameObject accentGO = CreateUIObject("SideAccent", cardGO.transform);
            RectTransform accentRect = accentGO.GetComponent<RectTransform>();
            accentRect.anchorMin = new Vector2(leftSideAccent ? 0f : 1f, 0f);
            accentRect.anchorMax = new Vector2(leftSideAccent ? 0f : 1f, 1f);
            accentRect.pivot = new Vector2(leftSideAccent ? 0f : 1f, 0.5f);
            accentRect.anchoredPosition = Vector2.zero;
            accentRect.sizeDelta = new Vector2(6f, 0f);
            Image accentImg = accentGO.AddComponent<Image>();
            accentImg.color = barColor;
            accentImg.raycastTarget = false;

            // Header row: Resource Title (left) + Numeric Value (right)
            GameObject labelGO = CreateUIObject("LabelText", cardGO.transform);
            RectTransform labelRect = labelGO.GetComponent<RectTransform>();
            labelRect.anchorMin = new Vector2(0f, 0.52f);
            labelRect.anchorMax = new Vector2(0.58f, 0.92f);
            labelRect.offsetMin = new Vector2(18f, 0f);
            labelRect.offsetMax = new Vector2(0f, 0f);

            Text labelText = labelGO.AddComponent<Text>();
            labelText.font = font;
            labelText.text = title;
            labelText.fontSize = 18;
            labelText.fontStyle = FontStyle.Bold;
            labelText.alignment = TextAnchor.MiddleLeft;
            labelText.color = new Color(0.92f, 0.96f, 1f, 1f);
            labelText.raycastTarget = false;

            GameObject valueGO = CreateUIObject("ValueText", cardGO.transform);
            RectTransform valueRect = valueGO.GetComponent<RectTransform>();
            valueRect.anchorMin = new Vector2(0.52f, 0.52f);
            valueRect.anchorMax = new Vector2(1f, 0.92f);
            valueRect.offsetMin = new Vector2(0f, 0f);
            valueRect.offsetMax = new Vector2(-18f, 0f);

            Text valueText = valueGO.AddComponent<Text>();
            valueText.font = font;
            valueText.text = $"{Mathf.RoundToInt(initialPercent)}/100 ({Mathf.RoundToInt(initialPercent)}%)";
            valueText.fontSize = 17;
            valueText.fontStyle = FontStyle.Bold;
            valueText.alignment = TextAnchor.MiddleRight;
            valueText.color = barColor;
            valueText.raycastTarget = false;

            // Filling Bar Track Background
            GameObject trackGO = CreateUIObject("BarTrack", cardGO.transform);
            RectTransform trackRect = trackGO.GetComponent<RectTransform>();
            trackRect.anchorMin = new Vector2(0f, 0.14f);
            trackRect.anchorMax = new Vector2(1f, 0.44f);
            trackRect.offsetMin = new Vector2(18f, 0f);
            trackRect.offsetMax = new Vector2(-18f, 0f);

            Image trackBg = trackGO.AddComponent<Image>();
            trackBg.color = new Color(0.02f, 0.04f, 0.08f, 0.95f);
            trackBg.raycastTarget = false;

            Outline trackOutline = trackGO.AddComponent<Outline>();
            trackOutline.effectColor = new Color(1f, 1f, 1f, 0.15f);
            trackOutline.effectDistance = new Vector2(1f, -1f);

            // Filling Bar Foreground
            GameObject fillGO = CreateUIObject("BarFill", trackGO.transform);
            RectTransform fillRect = fillGO.GetComponent<RectTransform>();
            fillRect.anchorMin = Vector2.zero;
            fillRect.anchorMax = new Vector2(Mathf.Clamp01(initialPercent / 100f), 1f);
            fillRect.offsetMin = Vector2.zero;
            fillRect.offsetMax = Vector2.zero;

            Image fillImg = fillGO.AddComponent<Image>();
            fillImg.color = barColor;
            fillImg.raycastTarget = false;

            // Add 25%, 50%, 75% graduation tick marks on top of the bar track
            CreateTickMark(trackGO.transform, 0.25f);
            CreateTickMark(trackGO.transform, 0.50f);
            CreateTickMark(trackGO.transform, 0.75f);

            ResourceBarUI barUI = cardGO.AddComponent<ResourceBarUI>();
            barUI.Initialize(
                type,
                title,
                initialPercent,
                barColor,
                invertWarnings,
                labelText,
                valueText,
                fillImg,
                accentImg);

            return barUI;
        }

        private static void CreateTickMark(Transform trackParent, float normalizedX)
        {
            GameObject tick = CreateUIObject($"Tick_{Mathf.RoundToInt(normalizedX * 100)}", trackParent);
            RectTransform rect = tick.GetComponent<RectTransform>();
            rect.anchorMin = new Vector2(normalizedX, 0f);
            rect.anchorMax = new Vector2(normalizedX, 1f);
            rect.pivot = new Vector2(0.5f, 0.5f);
            rect.anchoredPosition = Vector2.zero;
            rect.sizeDelta = new Vector2(2f, 0f);

            Image img = tick.AddComponent<Image>();
            img.color = new Color(0.05f, 0.09f, 0.16f, 0.65f);
            img.raycastTarget = false;
        }

        private static GameObject CreateUIObject(string name, Transform parent)
        {
            GameObject go = new GameObject(name, typeof(RectTransform));
            go.transform.SetParent(parent, false);
            go.layer = parent.gameObject.layer;
            return go;
        }

        private static void StretchFullScreen(RectTransform rect, float padding)
        {
            rect.anchorMin = Vector2.zero;
            rect.anchorMax = Vector2.one;
            rect.offsetMin = new Vector2(padding, padding);
            rect.offsetMax = new Vector2(-padding, -padding);
        }

        private static Font LoadDefaultFont()
        {
            Font font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
            if (font == null)
            {
                font = Resources.GetBuiltinResource<Font>("Arial.ttf");
            }
            if (font == null)
            {
                font = Font.CreateDynamicFontFromOSFont("Arial", 16);
            }
            return font;
        }
    }
}
