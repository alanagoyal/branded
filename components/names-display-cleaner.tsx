"use client";
import { createClient } from "@/utils/supabase/client";
import { Icons } from "./icons";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { toast } from "./ui/use-toast";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { useRouter } from "next/navigation";
import { ToastAction } from "./ui/toast";

interface ResultItemProps {
  result: any; // Consider replacing 'any' with a more specific type based on your data structure
  type: "domain" | "trademark" | "logo";
}

const ResultItem: React.FC<ResultItemProps> = ({ result, type }) => {
  switch (type) {
    case "domain":
    case "trademark":
      return (
        <Link
          href={result.link}
          target="_blank"
          className="text-sm cursor-pointer"
        >
          {result.domain || result.keyword}
        </Link>
      );
    case "logo":
      return (
        <Link href={result} target="_blank" className="cursor-pointer">
          <Image src={result} alt="Logo" width={200} height={200} />
        </Link>
      );
    default:
      return null;
  }
};

interface NamesDisplayProps {
  namesList: Record<string, string>;
  user: any;
  verticalLayout?: boolean;
}

type ProcessingState = {
  domains: string[];
  npm: string[];
  trademark: string[];
  logo: string[];
  onePager: string[];
};

type ProcessingType = keyof ProcessingState;

interface ResultsState {
  domainResults: { [key: string]: any[] };
  npmResults: { [key: string]: any[] };
  trademarkResults: { [key: string]: any[] };
  logoResults: { [key: string]: any };
  onePager: { [key: string]: any };
}

export function NamesDisplayCleaner({
  namesList,
  user,
  verticalLayout = false,
}: NamesDisplayProps) {
  const router = useRouter();
  const supabase = createClient();
  const [processing, setProcessing] = useState<ProcessingState>({
    domains: [],
    npm: [],
    trademark: [],
    logo: [],
    onePager: [],
  });
  const [results, setResults] = useState<ResultsState>({
    domainResults: {},
    npmResults: {},
    trademarkResults: {},
    logoResults: {},
    onePager: {},
  });
  const [favoritedNames, setFavoritedNames] = useState<{
    [key: string]: boolean;
  }>({});
  const [isOwner, setIsOwner] = useState(false);
  const idString = Object.values(namesList).join(",");
  const signUpLink = idString
    ? `/signup?ids=${idString.replace(/,/g, "")}`
    : "/signup";

  useEffect(() => {
    if (user) {
      fetchOwner();
      fetchFavoritedStatus();
    }
  }, [namesList, user]);

  const fetchOwner = async () => {
    for (const name in namesList) {
      const { data: createdBy, error } = await supabase
        .from("names")
        .select()
        .eq("id", namesList[name])
        .single();
      if (createdBy?.created_by === user.id) {
        setIsOwner(true);
        break;
      }
    }
  };

  const fetchFavoritedStatus = async () => {
    const { data: favoritedData, error } = await supabase
      .from("names")
      .select("name, favorited")
      .eq("created_by", user.id);
    if (error) {
      toast({
        variant: "destructive",
        description: "Error fetching favorited status",
      });
      console.error("Error fetching favorited status:", error.message);
      return;
    }
    if (favoritedData) {
      const favoritedMap: { [key: string]: boolean } = {};
      favoritedData.forEach((item: { name: string; favorited: boolean }) => {
        favoritedMap[item.name] = item.favorited;
      });
      setFavoritedNames(favoritedMap);
    }
  };

  const toggleFavoriteName = async (name: string) => {
    try {
      const isFavorited = favoritedNames[name] || false;
      setFavoritedNames((prevState) => ({
        ...prevState,
        [name]: !isFavorited,
      }));

      const { error } = await supabase
        .from("names")
        .update({ favorited: !isFavorited })
        .eq("id", namesList[name]);

      toast({
        description: isFavorited
          ? "Removed from favorites"
          : "Added to favorites",
      });
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const findDomainNames = async (name: string) => {
    try {
      // Update the processing state to include the current name
      setProcessing((prev) => ({
        ...prev,
        domains: [...prev.domains, name],
      }));

      // Check if the domain results already include the current name
      const showingAvailability = results.domainResults[name];

      if (showingAvailability) {
        // If the domain is already in the results, remove it
        setResults((prevResults) => {
          const updatedDomainResults = { ...prevResults.domainResults };
          delete updatedDomainResults[name];
          return { ...prevResults, domainResults: updatedDomainResults };
        });
      } else {
        // If the domain is not in the results, fetch and add it
        const { data: domainData, error: domainError } = await supabase
          .from("domains")
          .select()
          .ilike("name", `%${name}%`);

        if (domainData && domainData.length > 0) {
          const updatedResults = domainData.map((item) => ({
            domain: item.domain_name,
            purchaseLink: item.purchase_link,
          }));

          setResults((prevResults) => ({
            ...prevResults,
            domainResults: {
              ...prevResults.domainResults,
              [name]: updatedResults,
            },
          }));
        } else {
          // Handle the case where no domains are found or an error occurs
          console.error("No domains found or error:", domainError);
        }
      }
    } catch (error) {
      console.error("Error finding domain names:", error);
    } finally {
      // Remove the name from the processing state
      setProcessing((prev) => ({
        ...prev,
        domains: prev.domains.filter((n) => n !== name),
      }));
    }
  };

  const checkTrademarks = async (name: string) => {
    try {
      // Update the processing state to include the current name for trademarks
      setProcessing((prev) => ({
        ...prev,
        trademark: [...prev.trademark, name],
      }));

      const showingAvailability = results.trademarkResults[name];
      if (showingAvailability) {
        // If the trademark is already in the results, remove it
        setResults((prevResults) => {
          const updatedTrademarkResults = { ...prevResults.trademarkResults };
          delete updatedTrademarkResults[name];
          return { ...prevResults, trademarkResults: updatedTrademarkResults };
        });
      } else {
        // If the trademark is not in the results, fetch and add it
        const { data: trademarkData, error: trademarkError } = await supabase
          .from("trademarks")
          .select()
          .eq("name_id", namesList[name]);

        if (trademarkData && trademarkData.length > 0) {
          const updatedResults = trademarkData.map((item) => ({
            keyword: item.keyword,
            description: item.description,
            link: item.link,
          }));

          setResults((prevResults) => ({
            ...prevResults,
            trademarkResults: {
              ...prevResults.trademarkResults,
              [name]: updatedResults,
            },
          }));
        } else if (trademarkError) {
          console.error("Error fetching trademarks:", trademarkError.message);
          toast({
            variant: "destructive",
            description: "Error fetching trademarks",
          });
        }
      }
    } catch (error) {
      console.error("Error checking trademarks:", error);
      toast({
        variant: "destructive",
        description: "An error occurred while checking trademarks",
      });
    } finally {
      // Remove the name from the processing state for trademarks
      setProcessing((prev) => ({
        ...prev,
        trademark: prev.trademark.filter((n) => n !== name),
      }));
    }
  };

  const findNpmNames = async (name: string) => {
    // Logic to find NPM names
  };

  const generateLogo = async (name: string) => {
    try {
      // Update the processing state to include the current name for logos
      setProcessing((prev) => ({
        ...prev,
        logo: [...prev.logo, name],
      }));

      const showingAvailability = results.logoResults[name];
      if (showingAvailability) {
        // If the logo is already in the results, remove it
        setResults((prevResults) => {
          const updatedLogoResults = { ...prevResults.logoResults };
          delete updatedLogoResults[name];
          return { ...prevResults, logoResults: updatedLogoResults };
        });
      } else {
        let logoUrl = "";

        const { data: logoData, error } = await supabase
          .from("logos")
          .select()
          .eq("name_id", namesList[name]);

        if (logoData && logoData.length > 0) {
          logoUrl = logoData[0].logo_url;
        } else {
          const response = await fetch("/generate-logo", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: name,
            }),
          });

          if (!response.ok) {
            toast({
              variant: "destructive",
              description: "Error generating logo",
            });
            throw new Error("Error generating logo");
          }

          const data = await response.json();

          if (data.error) {
            toast({
              variant: "destructive",
              description: "Error generating logo",
            });
            throw new Error("Error generating logo");
          } else {
            logoUrl = data.imageUrl;

            const updates = {
              logo_url: logoUrl,
              created_at: new Date(),
              name_id: namesList[name],
              created_by: user.id,
            };

            let { error } = await supabase.from("logos").insert(updates);
            if (error) throw error;
          }
        }

        setResults((prev) => ({
          ...prev,
          logoResults: {
            ...prev.logoResults,
            [name]: logoUrl,
          },
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      // Remove the name from the processing state for logos
      setProcessing((prev) => ({
        ...prev,
        logo: prev.logo.filter((n) => n !== name),
      }));
    }
  };

  const createOnePager = async (name: string) => {
    try {
      // Update the processing state to include the current name for one-pagers
      setProcessing((prev) => ({
        ...prev,
        onePager: [...prev.onePager, name],
      }));

      const showingAvailability = results.onePager[name];
      if (showingAvailability) {
        // If the one-pager is already in the results, remove it
        setResults((prevResults) => {
          const updatedOnePagerResults = { ...prevResults.onePager };
          delete updatedOnePagerResults[name];
          return { ...prevResults, onePager: updatedOnePagerResults };
        });
      } else {
        let onePagerUrl = "";

        const { data: onePagerData } = await supabase
          .from("one_pagers")
          .select()
          .eq("name_id", namesList[name]);

        if (onePagerData && onePagerData.length > 0) {
          onePagerUrl = onePagerData[0].pdf_url;
        } else {
          const { data: nameData } = await supabase
            .from("names")
            .select()
            .eq("id", namesList[name])
            .single();

          const { data: userData } = await supabase
            .from("profiles")
            .select()
            .eq("id", user.id)
            .single();

          let logoUrl = null;

          const { data: logoData } = await supabase
            .from("logos")
            .select()
            .eq("name_id", namesList[name]);

          if (logoData && logoData.length > 0) {
            logoUrl = logoData[0].logo_url;
          }

          const response = await fetch("/generate-one-pager-content", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: name,
              description: nameData.description,
            }),
          });

          if (!response.ok) {
            toast({
              variant: "destructive",
              description: "Error generating one pager content",
            });
            throw new Error("Error generating one pager content");
          }

          const data = await response.json();

          if (data.error) {
            toast({
              variant: "destructive",
              description: "Error generating one pager content",
            });
            throw new Error("Error generating one pager content");
          }

          const content = data.response;

          if (content) {
            const response = await fetch(
              `/one-pager?content=${encodeURIComponent(
                JSON.stringify(content)
              )}&nameData=${encodeURIComponent(
                JSON.stringify(nameData)
              )}&userData=${encodeURIComponent(
                JSON.stringify(userData)
              )}&logoUrl=${encodeURIComponent(JSON.stringify(logoUrl))}`
            );

            if (!response.ok) {
              toast({
                variant: "destructive",
                description: "Error generating PDF",
              });
              throw new Error("Error generating PDF");
            }

            const data = await response.json();

            if (data.error) {
              toast({
                variant: "destructive",
                description: "Error generating PDF",
              });
              throw new Error("Error generating PDF");
            } else {
              onePagerUrl = data.link;

              const updates = {
                pdf_url: onePagerUrl,
                created_at: new Date(),
                name_id: namesList[name],
                created_by: user.id,
              };

              let { data: insertData, error } = await supabase
                .from("one_pagers")
                .insert(updates);

              if (error) throw error;
            }
          }
        }

        window.open(onePagerUrl, "_blank");

        setResults((prev) => ({
          ...prev,
          onePager: {
            ...prev.onePager,
            [name]: onePagerUrl,
          },
        }));
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Error generating one-pager",
      });
    } finally {
      // Remove the name from the processing state for one-pagers
      setProcessing((prev) => ({
        ...prev,
        onePager: prev.onePager.filter((n) => n !== name),
      }));
    }
  };

  const handleActionForUnauthenticatedUser = (actionType: string) => {
    toast({
      title: "Please create an account",
      description: `In order to ${actionType} this name, please sign up for a free account.`,
      action: (
        <ToastAction onClick={() => router.push(signUpLink)} altText="Sign up">
          Sign up
        </ToastAction>
      ),
    });
    return;
  };

  const renderActionButton = (
    name: string,
    action: (name: string) => void,
    processingType: ProcessingType,
    icon: JSX.Element,
    text: string
  ) => (
    <Button
      variant="ghost"
      disabled={processing[processingType].includes(name)}
      onClick={() =>
        user ? action(name) : handleActionForUnauthenticatedUser(text)
      }
    >
      {processing[processingType].includes(name) ? (
        <Icons.spinner />
      ) : (
        <>
          {icon}
          <span className="ml-2">{text}</span>
        </>
      )}
    </Button>
  );

  // Render function for each name
  const renderNameCard = (name: string) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          {renderActionButton(
            name,
            findDomainNames,
            "domains" as ProcessingType,
            <Icons.domain />,
            "Find available domain names"
          )}
          {results.domainResults[name] &&
            results.domainResults[name].map((result, idx) => (
              // Use a combination of name and idx for a unique key
              <ResultItem key={`${name}-domain-${idx}`} result={result} type="domain" />
            ))}
          {renderActionButton(
            name,
            checkTrademarks,
            "trademark" as ProcessingType,
            <Icons.trademark />,
            "Check trademarks"
          )}
          {results.trademarkResults[name] &&
            results.trademarkResults[name].map((result, idx) => (
              // Use a combination of name and idx for a unique key
              <ResultItem key={`${name}-trademark-${idx}`} result={result} type="trademark" />
            ))}
          {renderActionButton(
            name,
            generateLogo,
            "logo" as ProcessingType,
            <Icons.generate />,
            "Generate a logo"
          )}
          {results.logoResults[name] && (
            // Since logo is singular per name, just use name for the key
            <ResultItem key={`${name}-logo`} result={results.logoResults[name]} type="logo" />
          )}
          {renderActionButton(
            name,
            createOnePager,
            "onePager" as ProcessingType,
            <Icons.onePager />,
            "Generate a one-pager"
          )}
          {isOwner && (
            <Button
              onClick={() =>
                user
                  ? toggleFavoriteName(name)
                  : handleActionForUnauthenticatedUser("favorite")
              }
              variant="ghost"
            >
              {favoritedNames[name] ? (
                <>
                  <Icons.unfavorite />
                  <span className="ml-2">Remove from favorites</span>
                </>
              ) : (
                <>
                  <Icons.favorite />
                  <span className="ml-2">Add to favorites</span>
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      {verticalLayout ? (
        <div className="flex flex-col space-y-4">
          {Object.keys(namesList).map((name, index) => renderNameCard(name))}
        </div>
      ) : (
        <Carousel>
          <CarouselContent>
            {Object.keys(namesList).map((name, index) => (
              <CarouselItem key={index} className="h-auto">
                {renderNameCard(name)}
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      )}
      {!user && (
        <div className="py-2 text-sm text-center text-muted-foreground">
          <a href={signUpLink} className="underline">
            Create an account
          </a>{" "}
          to see available domain names, create a unique logo, and generate
          branded marketing materials for these names and more.
        </div>
      )}
    </div>
  );
}
