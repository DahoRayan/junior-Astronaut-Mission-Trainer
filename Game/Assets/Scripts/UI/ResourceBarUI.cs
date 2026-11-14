using UnityEngine;
using UnityEngine.UI;

namespace JuniorAstronaut.UI
{
    public enum ResourceType
    {
        Power,
        Hunger,
        Health,
        Food,
        FoodGrowth,
        Radiation
    }

    /// <summary>
    /// Controls a single filling bar and numeric percentage display for a mission resource.
    /// </summary>
    [ExecuteAlways]
    public class ResourceBarUI : MonoBehaviour
    {
        [Header("Resource Settings")]
        [SerializeField] private ResourceType resourceType;
        [SerializeField] private string displayName = "RESOURCE";
        [SerializeField, Range(0f, 100f)] private float currentPercentage = 100f;
        [SerializeField] private float maxPercentage = 100f;
        [SerializeField] private bool invertWarningThreshold;
        [SerializeField] private bool showFractionAndPercent = true;

        [Header("Colors")]
        [SerializeField] private Color normalColor = new Color(0.2f, 0.8f, 1f, 1f);
        [SerializeField] private Color warningColor = new Color(1f, 0.75f, 0.2f, 1f);
        [SerializeField] private Color criticalColor = new Color(1f, 0.3f, 0.3f, 1f);
        [SerializeField] private bool useDynamicThresholdColor = false;

        [Header("UI References")]
        [SerializeField] private Text labelText;
        [SerializeField] private Text valueText;
        [SerializeField] private Image fillImage;
        [SerializeField] private RectTransform fillRect;
        [SerializeField] private Image borderAccentImage;

        [Header("Animation")]
        [SerializeField] private bool smoothFill = true;
        [SerializeField] private float fillSpeed = 8f;

        private float displayedNormalized = 1f;
        private static Sprite s_DefaultFillSprite;

        public ResourceType Type => resourceType;
        public float Percentage => currentPercentage;

        public void Initialize(
            ResourceType type,
            string title,
            float initialPercent,
            Color barColor,
            bool invertWarnings,
            Text label,
            Text numValText,
            Image fill,
            Image borderAccent)
        {
            resourceType = type;
            displayName = title;
            normalColor = barColor;
            invertWarningThreshold = invertWarnings;
            labelText = label;
            valueText = numValText;
            fillImage = fill;
            fillRect = fill != null ? fill.rectTransform : null;
            borderAccentImage = borderAccent;

            EnsureFillSprite();
            SetPercentageImmediate(initialPercent);
        }

        private void Awake()
        {
            EnsureFillSprite();
            RefreshVisualsImmediate();
        }

        private void OnValidate()
        {
            currentPercentage = Mathf.Clamp(currentPercentage, 0f, maxPercentage);
            EnsureFillSprite();
            RefreshVisualsImmediate();
        }

        private void Update()
        {
            float targetNormalized = maxPercentage > 0f ? Mathf.Clamp01(currentPercentage / maxPercentage) : 0f;

            if (!Application.isPlaying || !smoothFill)
            {
                displayedNormalized = targetNormalized;
            }
            else
            {
                displayedNormalized = Mathf.MoveTowards(
                    displayedNormalized,
                    targetNormalized,
                    fillSpeed * Time.unscaledDeltaTime);
            }

            ApplyFill(displayedNormalized);
        }

        /// <summary>
        /// Sets the resource percentage (0 to 100) with smooth bar animation.
        /// </summary>
        public void SetPercentage(float percentage)
        {
            currentPercentage = Mathf.Clamp(percentage, 0f, maxPercentage);
            UpdateTextAndColor();

            if (!Application.isPlaying || !smoothFill)
            {
                displayedNormalized = maxPercentage > 0f ? Mathf.Clamp01(currentPercentage / maxPercentage) : 0f;
                ApplyFill(displayedNormalized);
            }
        }

        /// <summary>
        /// Immediately snaps the resource percentage and bar fill without interpolation.
        /// </summary>
        public void SetPercentageImmediate(float percentage)
        {
            currentPercentage = Mathf.Clamp(percentage, 0f, maxPercentage);
            displayedNormalized = maxPercentage > 0f ? Mathf.Clamp01(currentPercentage / maxPercentage) : 0f;
            RefreshVisualsImmediate();
        }

        public void RefreshVisualsImmediate()
        {
            displayedNormalized = maxPercentage > 0f ? Mathf.Clamp01(currentPercentage / maxPercentage) : 0f;
            UpdateTextAndColor();
            ApplyFill(displayedNormalized);
        }

        private void UpdateTextAndColor()
        {
            if (labelText != null)
            {
                labelText.text = displayName;
            }

            if (valueText != null)
            {
                int rounded = Mathf.RoundToInt(currentPercentage);
                int maxRounded = Mathf.RoundToInt(maxPercentage);
                valueText.text = showFractionAndPercent
                    ? $"{rounded}/{maxRounded} ({rounded}%)"
                    : $"{rounded}%";
            }

            Color activeColor = EvaluateColor(currentPercentage);
            if (fillImage != null)
            {
                fillImage.color = activeColor;
            }

            if (borderAccentImage != null)
            {
                borderAccentImage.color = new Color(activeColor.r, activeColor.g, activeColor.b, 0.85f);
            }
        }

        private void ApplyFill(float normalized)
        {
            normalized = Mathf.Clamp01(normalized);

            if (fillImage != null)
            {
                EnsureFillSprite();
                fillImage.type = Image.Type.Filled;
                fillImage.fillMethod = Image.FillMethod.Horizontal;
                fillImage.fillOrigin = (int)Image.OriginHorizontal.Left;
                fillImage.fillAmount = normalized;
            }

            if (fillRect != null)
            {
                fillRect.anchorMin = Vector2.zero;
                fillRect.anchorMax = new Vector2(normalized, 1f);
                fillRect.offsetMin = Vector2.zero;
                fillRect.offsetMax = Vector2.zero;
            }
        }

        private Color EvaluateColor(float pct)
        {
            if (!useDynamicThresholdColor)
            {
                return normalColor;
            }

            if (!invertWarningThreshold)
            {
                if (pct <= 20f) return criticalColor;
                if (pct <= 45f) return warningColor;
                return normalColor;
            }
            else
            {
                // For Hunger or Radiation where higher % means higher danger
                if (pct >= 80f) return criticalColor;
                if (pct >= 55f) return warningColor;
                return normalColor;
            }
        }

        private void EnsureFillSprite()
        {
            if (fillImage == null || fillImage.sprite != null)
            {
                return;
            }

            if (s_DefaultFillSprite == null)
            {
                Texture2D tex = Texture2D.whiteTexture;
                s_DefaultFillSprite = Sprite.Create(
                    tex,
                    new Rect(0f, 0f, tex.width, tex.height),
                    new Vector2(0.5f, 0.5f));
                s_DefaultFillSprite.name = "RuntimeWhiteFillSprite";
            }

            fillImage.sprite = s_DefaultFillSprite;
        }
    }
}
