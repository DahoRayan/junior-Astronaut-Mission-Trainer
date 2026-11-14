#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using JuniorAstronaut.UI;

namespace JuniorAstronaut.Editor
{
    [InitializeOnLoad]
    public static class ResourceHUDSetupEditor
    {
        static ResourceHUDSetupEditor()
        {
            EditorApplication.delayCall += EnsureSceneHasHUD;
        }

        [MenuItem("Tools/Junior Astronaut/Create or Refresh Perimeter HUD")]
        public static void CreateOrRefreshHUDMenu()
        {
            ResourceHUDController controller = Object.FindFirstObjectByType<ResourceHUDController>();
            if (controller == null)
            {
                GameObject hudGO = new GameObject("ResourceHUD");
                Undo.RegisterCreatedObjectUndo(hudGO, "Create Resource HUD");
                controller = hudGO.AddComponent<ResourceHUDController>();
            }

            controller.RebuildHUD();
            Selection.activeGameObject = controller.gameObject;
            EditorSceneManager.MarkSceneDirty(controller.gameObject.scene);
        }

        private static void EnsureSceneHasHUD()
        {
            if (EditorApplication.isPlayingOrWillChangePlaymode)
            {
                return;
            }

            ResourceHUDController existing = Object.FindFirstObjectByType<ResourceHUDController>();
            if (existing == null)
            {
                GameObject hudGO = new GameObject("ResourceHUD");
                existing = hudGO.AddComponent<ResourceHUDController>();
                existing.EnsureUIBuilt();
                EditorSceneManager.MarkSceneDirty(hudGO.scene);
            }
            else
            {
                existing.EnsureUIBuilt();
            }
        }
    }
}
#endif
